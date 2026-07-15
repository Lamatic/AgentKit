"use server"

/**
 * Sends a simulated customer message to the order-intake Lamatic webhook.
 * Used by the Simulate page to test the agent without a real WhatsApp number.
 * @param message - The Hinglish message text to send
 * @returns Promise resolving to the webhook response JSON
 * @throws Error if ORDER_INTAKE_WEBHOOK_URL is not set or the request fails
 */
export async function sendMessage(message: string) {
  const url = process.env.ORDER_INTAKE_WEBHOOK_URL
  if (!url) throw new Error("ORDER_INTAKE_WEBHOOK_URL not set in .env.local")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Body: message,
      From: "whatsapp:+919350530047",
      To: "whatsapp:+14155238886",
      MessageSid: "SM_sim_" + Date.now(),
      ProfileName: "Dashboard User",
      WaId: "919350530047",
    }),
  })
  if (!res.ok) throw new Error("Webhook error: " + res.status)
  return res.json()
}

/**
 * Sends a product catalog to the catalog-indexer Lamatic webhook for vector indexing.
 * Each item is formatted as searchable text and indexed with Gemini embeddings.
 * @param items - Array of catalog items with name, aliases, unit, price, and stock fields
 * @returns Promise resolving to the webhook response JSON
 * @throws Error if CATALOG_INDEXER_WEBHOOK_URL is not set or the request fails
 */
export async function uploadCatalog(items: CatalogItem[]) {
  const url = process.env.CATALOG_INDEXER_WEBHOOK_URL
  if (!url) throw new Error("CATALOG_INDEXER_WEBHOOK_URL not set in .env.local")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) throw new Error("Catalog webhook error: " + res.status)
  return res.json()
}

/** Shape of a single catalog item sent to the indexer */
export interface CatalogItem {
  name: string
  aliases: string
  unit: string
  price: number
  stock: boolean
}