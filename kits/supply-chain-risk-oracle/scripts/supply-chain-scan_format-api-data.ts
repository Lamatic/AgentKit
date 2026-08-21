let newsArticles = [];
let weatherData = {};

try {
  const raw = input.news_response;
  const parsed = typeof raw === "string" ? JSON.parse(
    raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
  ) : raw;
  newsArticles = (parsed?.articles ?? []).slice(0, 8).map((a) => ({
    title: a.title,
    description: a.description,
    source: a.source?.name,
    publishedAt: a.publishedAt,
    url: a.url
  }));
} catch (e) {
  newsArticles = [];
}

try {
  const raw = input.weather_response;
  weatherData = typeof raw === "string" ? JSON.parse(raw) : raw;
} catch (e) {
  weatherData = {};
}

const newsText = newsArticles.length > 0
  ? newsArticles.map((a, i) =>
      `${i + 1}. [${a.source}] ${a.title} — ${a.description ?? ""} (${a.publishedAt?.slice(0, 10) ?? ""})`
    ).join("\n")
  : "No live news articles retrieved.";

const weatherText = weatherData?.weather
  ? `${weatherData.name ?? ""}: ${weatherData.weather[0]?.description ?? ""}, temp ${weatherData.main?.temp ?? "?"}°C, wind ${weatherData.wind?.speed ?? "?"}m/s`
  : "No live weather data retrieved.";

output = {
  news_text: newsText,
  weather_text: weatherText
};
