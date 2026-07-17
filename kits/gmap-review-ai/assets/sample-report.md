# Sample Run — Worked Example (Real Data)

This is a real worked example, not a mockup. While building this kit, the exact
`compass/Google-Maps-Reviews-Scraper` Actor call in `scripts/reputation-pulse_fetch-reviews.ts`
was run live against two real, well-known Colaba, Mumbai cafes on Google Maps — **Leopold
Cafe** as "the business" and **Cafe Mondegar** as a named competitor — with `maxReviews: 15`
per place. The JSON that call returned was then reshaped exactly as the code node does, and run
through the system/user prompts in `prompts/` by hand to confirm the design actually produces a
useful report before asking a reviewer to trust the spec. This is that output.

**Request used:**
```json
{
  "business_name": "Leopold Cafe",
  "business_maps_url": "https://www.google.com/maps/search/Leopold+Cafe+Colaba+Mumbai",
  "competitor_maps_urls": ["https://www.google.com/maps/search/Cafe+Mondegar+Colaba+Mumbai"],
  "max_reviews_per_place": 15,
  "reviews_since": "3 months"
}
```

---

## Headline
Leopold Cafe is holding a strong **4.2★** all-time aggregate across **32,641** Google reviews, and the 14 most recent reviews in this sample average **4.21★** — a large, high-traffic listing with a steady stream of new reviews (several per day) and no sign of recent slippage.

## What's Working
- **Food and drinks land well.** Several reviews call out the food specifically — cold coffee, and both savory and sweet dishes praised by name in one detailed review — roughly 4 of the 7 text reviews in the sample mention food positively.
- **Broad, low-friction satisfaction.** Short, enthusiastic reviews ("Nice", "Great", "loving it") show visitors leaving happy without needing much to go right.
- **Sustained volume at scale.** 9 of the 14 sampled reviews were 5-star, consistent with a venue carrying 32k+ lifetime reviews without its rating eroding.

## What Needs Fixing
1. **Service lags food and atmosphere, even in happy visits.** One 5-star review rated service 3/5 while rating food and atmosphere 5/5 — a gap worth watching before it shows up in the star rating itself.
2. **Crowding and wait times.** An international visitor's review specifically flags the venue being extremely crowded with long queues and little room to move — a recurring risk for a high-volume single location.
3. **Low-rated reviews carry no explanation.** Both sub-3-star reviews in the sample (1★, 2★) were left with no text, so the specific cause of those visits going wrong isn't visible in this data — worth prompting for detail (e.g. a follow-up quick-reply) so future samples aren't blind here.

## How You Compare — vs. Cafe Mondegar
Cafe Mondegar's all-time aggregate is slightly higher (**4.4★** vs Leopold's 4.2★), but over a much smaller base (5,931 vs 32,641 reviews) — its rating has less volume to hold steady against. In this sample, Leopold's recent average (4.21) actually edges ahead of Mondegar's (4.13), suggesting comparable or slightly better recent momentum. Mondegar's positive reviews lean on heritage and hospitality ("100+ year old cafe," fast service, good vibes) — a angle Leopold's sample doesn't explicitly claim and could borrow for its own messaging. On service specifically, Mondegar's sample surfaced a sharper complaint than anything in Leopold's ("very rude staff," service rated 1/5 in one detailed review) — Leopold's service gap (above) is milder by comparison in this data, but both venues show service as the weaker aspect relative to food and atmosphere.

## Reviews Worth Responding To
One of Leopold Cafe's own reviews in this sample is negative, has text, and has no owner response yet:

> **3★:** "It was all okay"

**Draft reply:** "Hi there, thanks for stopping by and for the honest feedback. 'Okay' isn't the bar we want to clear — could you tell us what would have made it a great visit? We'd love the chance to make it right."

---

*Note: this sample intentionally used a small `maxReviews` to keep the demo run cheap and fast — a production run with the default `max_reviews_per_place: 30` and a wider `reviews_since` window will surface more text-bearing reviews and a more confident theme count than this worked example shows.*
