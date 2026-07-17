export const maxDuration = 10;
import { NextResponse } from 'next/server';
import { Lamatic } from 'lamatic';

// ══════════════════════════════════════════════════════════════════
// PRODUCTION LEVEL: Lamatic AI Evaluation Endpoint
// ══════════════════════════════════════════════════════════════════
// This endpoint is the bridge between the Chrome Extension and the
// Lamatic AI Flow deployed in Studio. The extension sends page context
// (URL, Title, H1, Meta) and active rules. This endpoint forwards
// that payload to the Lamatic Flow, which runs the LLM evaluation,
// and returns a verdict: "BLOCK" or "PASS".
//
// Architecture:
//   [Chrome Extension] --> [Next.js /api/evaluate] --> [Lamatic AI Flow]
//        background.js          this file              Studio Diagram
// ══════════════════════════════════════════════════════════════════

// ** PRODUCTION LEVEL: Singleton Lamatic Client ** //
// Initialized once at module load, reused across all requests.
// This avoids creating a new client on every API call.
const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? null,
  apiKey: process.env.LAMATIC_API_KEY ?? "",
});

/**
 * The core AI evaluator endpoint bridging the Chrome Extension and Lamatic Studio.
 * 
 * This route receives the scraped DOM context from the extension and the active 
 * block rules from the local DB. It formats these into a standard payload and 
 * fires it off to the remote Lamatic AI Flow for a "BLOCK" or "PASS" verdict.
 * 
 * @param {Request} req - The incoming POST request containing the DOM and rules payload.
 * @returns {Promise<NextResponse>} A JSON response containing the AI's action verdict and raw LLM response.
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const payload = await req.json();

    if (!payload || typeof payload.url !== 'string' || payload.url.length > 2000) return NextResponse.json({ action: "PASS" });
    if (typeof payload.title !== 'string' || payload.title.length > 500) return NextResponse.json({ action: "PASS" });

    console.log(`\n═══════════════════════════════════════════`);
    console.log(`🚀 [LAMATIC AI] /api/evaluate HIT`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   🔗 URL: ${payload.url}`);
      console.log(`   🏷️  Title: ${payload.title}`);
      console.log(`   📝 H1: ${payload.h1Text || "(none)"}`);
      console.log(`   📄 Meta: ${payload.description || "(none)"}`);
      console.log(`   📋 Active Rules: ${JSON.stringify(payload.dbRules)}`);
    } else {
      console.log(`   🔗 Evaluating URL...`);
    }

    // ** PRODUCTION LEVEL: Environment Validation ** //
    const flowId = process.env.CONTENT_CLASSIFICATION_FLOW_ID;
    const apiUrl = process.env.LAMATIC_API_URL;
    const projectId = process.env.LAMATIC_PROJECT_ID;
    const apiKey = process.env.LAMATIC_API_KEY;

    console.log(`   🔧 Config Check:`);
    console.log(`      LAMATIC_API_URL: ${apiUrl ? "✅ Set" : "❌ MISSING"}`);
    console.log(`      LAMATIC_PROJECT_ID: ${projectId ? "✅ Set" : "❌ MISSING"}`);
    console.log(`      LAMATIC_API_KEY: ${apiKey ? "✅ Set" : "❌ MISSING"}`);
    console.log(`      CONTENT_CLASSIFICATION_FLOW_ID: ${flowId ? "✅ " + flowId : "❌ MISSING"}`);

    if (!flowId) {
      console.error("❌ [LAMATIC] Missing CONTENT_CLASSIFICATION_FLOW_ID in .env.local");
      return NextResponse.json({ action: "PASS", error: "Missing Flow ID" });
    }

    // ** PRODUCTION LEVEL: Payload Transformation ** //
    // Combine BOTH types of rules into one string for the LLM:
    //   1. Static domain rules (e.g. "youtube.com", "instagram.com")
    //   2. AI natural language rules (e.g. "Allow Only DSA related content")
    const staticRules = Array.isArray(payload.dbRules)
      ? payload.dbRules.join(", ")
      : (payload.dbRules || "");
    
    const aiRules = Array.isArray(payload.aiRules)
      ? payload.aiRules.join(", ")
      : (payload.aiRules || "");

    // Merge both rule types into one comprehensive string
    const allRuleParts = [staticRules, aiRules].filter(Boolean);
    const activeRulesString = allRuleParts.join(" | AI Rules: ");

    console.log(`   📋 Static Rules: ${staticRules || "(none)"}`);
    console.log(`   🤖 AI Rules: ${aiRules || "(none)"}`);
    console.log(`   🔗 Combined Rules String: ${activeRulesString || "(none)"}`);
    console.log(`   📤 Calling lamaticClient.executeFlow()...`);

    let timeoutId: NodeJS.Timeout;
    // ** PRODUCTION LEVEL: Execute the Lamatic Flow ** //
    const resData = (await Promise.race([
      lamaticClient.executeFlow(flowId, {
        url: payload.url || "",
        title: payload.title || "",
        h1: payload.h1Text || "",
        meta: payload.description || "",
        activeRules: activeRulesString,
      }).finally(() => clearTimeout(timeoutId)),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Flow execution timeout")), 8000);
      })
    ])) as any;

    const elapsed = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`   📥 Raw Lamatic Response: ${JSON.stringify(resData)}`);
    } else {
      console.log(`   📥 Received response from AI`);
    }
    console.log(`   ⏱️  Lamatic SDK call took ${elapsed}ms`);

    // ** PRODUCTION LEVEL: Response Parsing ** //
    // Lamatic returns the LLM output nested inside result.action as an OBJECT:
    //   result.action.generatedResponse = "BLOCK" or "PASS"
    // NOT as a plain string. This is the standard Lamatic SDK response format.
    const actionObj = resData?.result?.action;
    let rawAction: string;

    if (typeof actionObj === 'string') {
      // Direct string (in case Lamatic changes format)
      rawAction = actionObj;
    } else if (actionObj?.generatedResponse) {
      // Standard Lamatic format: action is an object with generatedResponse
      rawAction = actionObj.generatedResponse;
    } else {
      // Fallback: try to find any string that looks like BLOCK or PASS
      rawAction = "PASS";
      console.warn(`   ⚠️ Could not parse action from response. Defaulting to PASS.`);
      console.warn(`   ⚠️ action object was:`, JSON.stringify(actionObj));
    }

    console.log(`   🔍 Extracted raw action: "${rawAction}"`);

    const sanitizedAction = rawAction.trim().toUpperCase() === "BLOCK" ? "BLOCK" : "PASS";

    console.log(`   ✅ Final Decision: ${sanitizedAction}`);
    console.log(`═══════════════════════════════════════════\n`);

    return NextResponse.json({ action: sanitizedAction });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n═══════════════════════════════════════════`);
    console.error(`❌ [LAMATIC AI] Flow execution FAILED after ${elapsed}ms`);
    console.error(`   Error:`, error instanceof Error ? error.message : error);
    console.error(`   Stack:`, error instanceof Error ? error.stack : "(no stack)");
    console.error(`═══════════════════════════════════════════\n`);
    return NextResponse.json({ action: "PASS", error: "AI evaluation failed" });
  }
}
