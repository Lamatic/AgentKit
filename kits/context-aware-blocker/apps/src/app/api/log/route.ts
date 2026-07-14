import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // ** PRODUCTION LEVEL LOGIC: Bridge Extension logs to VS Code Terminal ** //
    console.log("\n=========================================");
    console.log("🧠 [AI ENGINE] Evaluating Context:");
    console.log("🔗 URL:", payload.url);
    console.log("🏷️ Title:", payload.title);
    if (payload.h1Text) console.log("📝 H1:", payload.h1Text);
    if (payload.description) console.log("📄 Meta:", payload.description);
    if (payload.dbRules) console.log("🗄️ Active DB Rules:", payload.dbRules.join(", ") || "None");
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to parse log" }, { status: 400 });
  }
}
