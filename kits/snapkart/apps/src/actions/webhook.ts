"use server"
export async function sendMessage(message:string) {
  const url=process.env.ORDER_INTAKE_WEBHOOK_URL
  if(!url) throw new Error("ORDER_INTAKE_WEBHOOK_URL not set in .env.local")
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({Body:message,From:"whatsapp:+919350530047",To:"whatsapp:+14155238886",MessageSid:"SM_sim_"+Date.now(),ProfileName:"Dashboard User",WaId:"919350530047"})})
  if(!res.ok) throw new Error("Webhook error: "+res.status)
  return res.json()
}
export async function uploadCatalog(items: unknown[]) {
  const url=process.env.CATALOG_INDEXER_WEBHOOK_URL
  if(!url) throw new Error("CATALOG_INDEXER_WEBHOOK_URL not set in .env.local")
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})})
  if(!res.ok) throw new Error("Catalog webhook error: "+res.status)
  return res.json()
}