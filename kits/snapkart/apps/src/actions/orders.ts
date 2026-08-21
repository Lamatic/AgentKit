"use server"

/** Represents a single order record from Airtable */
export interface Order {
  id: string
  phone: string
  items: string
  total: number
  status: string
  created: string
}

/**
 * Fetches the 50 most recent orders from Airtable sorted by creation date descending.
 * Requires AIRTABLE_TOKEN and AIRTABLE_BASE_ID environment variables.
 * @returns Promise resolving to an array of Order objects
 * @throws Error if environment variables are missing or Airtable returns an error
 */
export async function fetchOrders(): Promise<Order[]> {
  const token = process.env.AIRTABLE_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  if (!token || !baseId) throw new Error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set in .env.local")
  const res = await fetch(
    "https://api.airtable.com/v0/" + baseId + "/Orders?sort[0][field]=created&sort[0][direction]=desc&maxRecords=50",
    { headers: { Authorization: "Bearer " + token }, next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error("Airtable error: " + res.status)
  const data = await res.json()
  return (data.records || []).map((r: any) => ({
    id: r.id,
    phone: r.fields.phone || "",
    items: r.fields.items || "",
    total: r.fields.total || 0,
    status: r.fields.status || "pending",
    created: r.fields.created || r.createdTime,
  }))
}

/**
 * Updates the status of a single order record in Airtable.
 * @param recordId - The Airtable record ID (starts with rec)
 * @param status - New status value: pending, confirmed, or delivered
 * @param order - The order object containing phone and items for WhatsApp notification
 * @returns Promise resolving to the updated Airtable record
 * @throws Error if the PATCH request fails
 */
export async function updateOrderStatus(recordId: string, status: string, order: { phone: string; items: string }) {
  const token = process.env.AIRTABLE_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  const res = await fetch("https://api.airtable.com/v0/" + baseId + "/Orders/" + recordId, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { status } }),
  })
  if (!res.ok) throw new Error("Update failed: " + res.status)

  if (status === "confirmed") {
    await sendWhatsAppConfirmation(order.phone, order.items)
  }
  return res.json()
}

/**
 * Sends a WhatsApp confirmation message to the customer via Twilio REST API.
 * @param phone - Customer phone number in format +919XXXXXXXXX
 * @param items - Human-readable order items string
 */
async function sendWhatsAppConfirmation(phone: string, items: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) return
  const to = phone.startsWith("whatsapp:") ? phone : "whatsapp:" + phone
  await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: "Aapka order confirm ho gaya! Items: " + items + ". Jald delivery hogi. - SnapKart" }),
  })
}

/**
 * Fetches the count of orders with pending status from Airtable.
 * Used by the Nav component to show the pending orders badge.
 * @returns Promise resolving to the number of pending orders
 */
export async function fetchPendingCount(): Promise<number> {
  const token = process.env.AIRTABLE_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  if (!token || !baseId) return 0
  const res = await fetch(
    "https://api.airtable.com/v0/" + baseId + "/Orders?filterByFormula={status}='pending'&fields[]=status",
    { headers: { Authorization: "Bearer " + token }, next: { revalidate: 0 } }
  )
  if (!res.ok) return 0
  const data = await res.json()
  return (data.records || []).length
}