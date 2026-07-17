import { NextResponse } from 'next/server';

/**
 * A Next.js API route that acts as a secure logging bridge.
 * 
 * Since Chrome Extensions have isolated DevTools consoles that are often hidden 
 * from the user, this endpoint allows the extension's background script to flush 
 * its telemetry (e.g. AI decisions, parsed DOM contexts) directly into the Next.js 
 * terminal window where the developer is actively watching.
 * 
 * @param {Request} req - The incoming HTTP POST request containing a JSON payload.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    if (!payload || typeof payload.url !== 'string' || payload.url.length > 2000) return NextResponse.json({ success: false }, { status: 400 });

    if (process.env.NODE_ENV !== 'production') {
      // ** PRODUCTION LEVEL LOGIC: Bridge Extension logs to VS Code Terminal ** //
      console.log("\n=========================================");
      console.log("🧠 [AI ENGINE] Evaluating Context:");
      console.log("🔗 URL:", payload.url);
      console.log("🏷️ Title:", payload.title);
      if (payload.h1Text) console.log("📝 H1:", payload.h1Text);
      if (payload.description) console.log("📄 Meta:", payload.description);
      if (payload.dbRules) console.log("🗄️ Active DB Rules:", payload.dbRules.join(", ") || "None");
      if (payload.aiRules) console.log("🤖 Active AI Rules:", payload.aiRules.join(", ") || "None");
      if (payload.sleepingBlocks && payload.sleepingBlocks.length > 0) {
        console.log("💤 Sleeping Blocks:", payload.sleepingBlocks.join(", "));
      }
      if (payload.status) {
        if (payload.status.startsWith("BLOCKED")) {
          console.log("❌ STATUS:", payload.status);
        } else {
          console.log("✅ STATUS:", payload.status);
        }
      }
      console.log("=========================================\n");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to parse log" }, { status: 400 });
  }
}
