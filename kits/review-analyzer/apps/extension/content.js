// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeReviews") {
    console.log("Scraping reviews...");

    // E-commerce review text CSS selectors
    const selectors = [
      ".review-text-content span",         // Amazon product review body
      "[data-hook='review-body']",         // Amazon alternative
      ".review-text",                      // Generic review classes
      ".review-content",                   // Generic
      ".review-body",                      // Generic
      ".comment-text",                     // Generic
      "[itemprop='description']"           // Structured semantic meta descriptions
    ];

    let reviews = [];

    // Search page using predefined selectors
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        elements.forEach(el => {
          const text = el.innerText.trim();
          // Filter out short reviews or duplicate entries
          if (text.length > 12 && !reviews.includes(text)) {
            reviews.push(text);
          }
        });
      }
      // If we've successfully found reviews using a selector, stop searching
      if (reviews.length >= 3) break;
    }

    // Fallback: If specific selectors didn't match, search using class/id naming heuristic
    if (reviews.length === 0) {
      const elements = document.querySelectorAll("div, span, p");
      elements.forEach(el => {
        const className = el.className;
        const id = el.id;
        if (
          (typeof className === "string" && (className.includes("review-text") || className.includes("review-body") || className.includes("comment-text"))) ||
          (typeof id === "string" && (id.includes("review-text") || id.includes("review-body")))
        ) {
          const text = el.innerText.trim();
          if (text.length > 15 && !reviews.includes(text)) {
            reviews.push(text);
          }
        }
      });
    }

    // Limit to top 50 reviews to stay within token limits and optimize latency
    reviews = reviews.slice(0, 50);

    console.log(`[Review Scraper] Extracted ${reviews.length} reviews.`);
    sendResponse({ success: true, reviews: reviews });
  }
  return true; // Keep message port open for async response
});
