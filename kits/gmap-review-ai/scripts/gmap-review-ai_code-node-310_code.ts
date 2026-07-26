const businessName = {{triggerNode_1.output.business_name}};
const businessMapsUrl = {{triggerNode_1.output.business_maps_url}};
const competitorUrls = {{triggerNode_1.output.competitor_maps_urls}} || [];
const maxReviews = {{triggerNode_1.output.max_reviews_per_place}} || 30;
const reviewsSince = {{triggerNode_1.output.reviews_since}} || "3 months";

// Apify project secret — add this under Lamatic Studio → Settings → Secrets.
const APIFY_TOKEN = {{secrets.project.APIFY_API_TOKEN}};

const ACTOR_ENDPOINT =
  "https://api.apify.com/v2/acts/compass~Google-Maps-Reviews-Scraper/run-sync-get-dataset-items";

const startUrls = [
  { url: businessMapsUrl },
  ...competitorUrls.filter(Boolean).map((url) => ({ url })),
];

const apifyResp = await fetch(`${ACTOR_ENDPOINT}?token=${encodeURIComponent(APIFY_TOKEN)}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    startUrls,
    maxReviews,
    reviewsSort: "newest",
    reviewsStartDate: reviewsSince,
    language: "en",
    reviewsOrigin: "google",
    // Kept off by default: Google returns reviewer name/URL/photo as null under this setting.
    // Report quality is unaffected — only name-personalized response drafts degrade to a
    // generic greeting. Flip to true only if you specifically need reviewer names and have
    // considered the GDPR note in Apify's own input schema for this field.
    personalData: false,
  }),
});

if (!apifyResp.ok) {
  const errText = await apifyResp.text();
  throw new Error(`Apify review fetch failed: ${apifyResp.status} — ${errText}`);
}

const rawReviews = await apifyResp.json();

if (!Array.isArray(rawReviews) || rawReviews.length === 0) {
  throw new Error(
    "No reviews were returned. Double-check that business_maps_url (and any competitor URLs) point to real, public Google Maps place listings."
  );
}

// Apify does not guarantee the dataset preserves the order of startUrls, so group by the
// resolved place title and match "the business" by name instead of by position.
const groups = [];
for (const row of rawReviews) {
  const title = row.title || "Unknown place";
  let group = groups.find((g) => g.title === title);
  if (!group) {
    group = { title, rows: [] };
    groups.push(group);
  }
  group.rows.push(row);
}

const norm = (s) => (s || "").toLowerCase().trim();
const businessGroup =
  groups.find(
    (g) => norm(g.title).includes(norm(businessName)) || norm(businessName).includes(norm(g.title))
  ) || groups[0];

const competitorGroups = groups.filter((g) => g !== businessGroup);

function summarizePlace(group) {
  const rows = group.rows;
  const ratings = rows.map((r) => r.stars).filter((n) => typeof n === "number");
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const distribution = [1, 2, 3, 4, 5].reduce((acc, n) => {
    acc[n] = ratings.filter((r) => r === n).length;
    return acc;
  }, {});

  const textReviews = rows
    .filter((r) => r.text && r.text.trim().length > 0)
    .slice(0, 40)
    .map((r) => ({
      rating: r.stars ?? null,
      text: r.text,
      publishedAt: r.publishedAtDate || r.publishAt || null,
      hasOwnerResponse: Boolean(r.responseFromOwnerText),
      reviewerName: r.name || null,
      foodRating: r.reviewDetailedRating?.Food ?? null,
      serviceRating: r.reviewDetailedRating?.Service ?? null,
      atmosphereRating: r.reviewDetailedRating?.Atmosphere ?? null,
    }));

  const unansweredNegativeReviews = rows
    .filter(
      (r) => (r.stars ?? 5) <= 3 && r.text && r.text.trim().length > 0 && !r.responseFromOwnerText
    )
    .slice(0, 5)
    .map((r) => ({ rating: r.stars, text: r.text, reviewerName: r.name || null }));

  return {
    placeName: rows[0]?.title || group.title,
    placeAddress: rows[0]?.address || null,
    aggregateRating: rows[0]?.totalScore ?? null,
    aggregateReviewCount: rows[0]?.reviewsCount ?? null,
    reviewsFetchedInThisRun: rows.length,
    sampleAverageRating: avg !== null ? Number(avg.toFixed(2)) : null,
    ratingDistributionInSample: distribution,
    textReviews,
    unansweredNegativeReviews,
  };
}

const businessReviewData = summarizePlace(businessGroup);
const competitorReviewData = competitorGroups.map(summarizePlace);

output = {
  businessReviewData,
  competitorReviewData,
  fetchedAt: new Date().toISOString(),
};