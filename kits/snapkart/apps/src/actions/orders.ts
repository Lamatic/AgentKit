"use server"

export interface Order { id:string; phone:string; items:string; total:number; status:string; created:string }

interface AirtableRecord { id:string; createdTime:string; fields: Record<string, unknown> }
interface AirtableListResponse { records?: AirtableRecord[] }

function airtableCreds() {
  const token=process.env.AIRTABLE_TOKEN, baseId=process.env.AIRTABLE_BASE_ID
  if(!token||!baseId) throw new Error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set in .env.local")
  return { token, baseId }
}

export async function fetchOrders(): Promise<Order[]> {
  const { token, baseId } = airtableCreds()
  const res=await fetch("https://api.airtable.com/v0/"+baseId+"/Orders?sort[0][field]=created&sort[0][direction]=desc&maxRecords=50",{headers:{Authorization:"Bearer "+token},next:{revalidate:0}})
  if(!res.ok) throw new Error("Airtable error: "+res.status)
  const data:AirtableListResponse=await res.json()
  return (data.records||[]).map(r=>({id:r.id,phone:(r.fields.phone as string)||"",items:(r.fields.items as string)||"",total:(r.fields.total as number)||0,status:(r.fields.status as string)||"pending",created:(r.fields.created as string)||r.createdTime}))
}

export async function fetchPendingCount(): Promise<number> {
  const orders = await fetchOrders()
  return orders.filter(o => o.status === "pending").length
}

function buildConfirmationVariables(items: string): Record<string, string> {
  return { "1": items || "your order" }
}

async function sendWhatsAppMessage(toPhone: string, contentVariables: Record<string, string>): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID, authToken = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_WHATSAPP_FROM, contentSid = process.env.TWILIO_CONTENT_SID
  if (!sid || !authToken || !from || !contentSid) throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM and TWILIO_CONTENT_SID must be set in .env.local")
  const params = new URLSearchParams({
    To: "whatsapp:" + toPhone,
    From: from,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(contentVariables),
  })
  const res = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(sid + ":" + authToken).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
  if (!res.ok) {
    let detail = ""
    try {
      const body: { message?: string; code?: number } = await res.json()
      if (body.message) detail = " - " + body.message + (body.code ? " (code " + body.code + ")" : "")
    } catch {
      // response wasn't JSON; fall back to bare status
    }
    throw new Error("Twilio error: " + res.status + detail)
  }
}

export interface UpdateOrderStatusResult { notified: boolean; notifyError?: string }

export async function updateOrderStatus(recordId: string, status: string, customer?: { phone: string; items: string }): Promise<UpdateOrderStatusResult> {
  const { token, baseId } = airtableCreds()
  const res=await fetch("https://api.airtable.com/v0/"+baseId+"/Orders/"+recordId,{
    method:"PATCH",
    headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({fields:{status},typecast:true}),
  })
  if(!res.ok) throw new Error("Airtable error: "+res.status)

  if (status === "confirmed" && customer?.phone) {
    try {
      await sendWhatsAppMessage(customer.phone, buildConfirmationVariables(customer.items))
      return { notified: true }
    } catch (e) {
      const notifyError = e instanceof Error ? e.message : "Failed to send WhatsApp notification"
      console.error("[updateOrderStatus] WhatsApp notification failed:", notifyError)
      return { notified: false, notifyError }
    }
  }
  return { notified: false }
}