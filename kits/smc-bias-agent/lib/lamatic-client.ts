import { SMCAnalysis } from "./types";

export interface BiasNarrative {
  reasoning: string;
  source: "lamatic" | "fallback";
}

/**
 * Builds the prompt sent to the LLM node in the Lamatic flow. Keeping this as
 * its own function means it can be pasted straight into the "Prompt" field of
 * the LLM node in Lamatic Studio, or reused by the local fallback below.
 */
export function buildBiasPrompt(analysis: SMCAnalysis): string {
  const { symbol, interval, lastPrice, bias, confidence, orderBlocks, fvgs, structureEvents } = analysis;

  const freshOBs = orderBlocks.filter((ob) => !ob.mitigated);
  const freshFVGs = fvgs.filter((f) => !f.filled);
  const lastEvent = structureEvents[structureEvents.length - 1];

  const obLines = freshOBs
    .map((ob) => `- ${ob.type} order block at ${ob.bottom}-${ob.top} (unmitigated)`)
    .join("\n") || "- none currently unmitigated";

  const fvgLines = freshFVGs
    .map((f) => `- ${f.type} fair value gap at ${f.bottom}-${f.top} (unfilled)`)
    .join("\n") || "- none currently unfilled";

  const structureLine = lastEvent
    ? `Most recent structure event: ${lastEvent.type} (${lastEvent.direction}), breaking the level at ${lastEvent.brokenLevel}.`
    : "No structure break detected yet in this window.";

  return `You are an assistant that explains Smart Money Concepts (SMC/ICT) price
structure to a trader in plain English. Do not give financial advice or tell
the reader to enter a trade — describe the structure and let them decide.

Symbol: ${symbol} (${interval} chart)
Last price: ${lastPrice}
Computed bias: ${bias} (${confidence}% confidence)
${structureLine}

Unmitigated order blocks:
${obLines}

Unfilled fair value gaps:
${fvgLines}

Write 3-5 short sentences: state the bias, explain which structure event
justifies it, point to the nearest unmitigated order block or unfilled FVG as
a level worth watching, and note one thing that would invalidate this bias.`;
}

function localFallbackNarrative(analysis: SMCAnalysis): string {
  const { symbol, bias, confidence, orderBlocks, fvgs, structureEvents } = analysis;
  const lastEvent = structureEvents[structureEvents.length - 1];
  const freshOB = orderBlocks.find((ob) => !ob.mitigated && ob.type === bias);
  const freshFVG = fvgs.find((f) => !f.filled && f.type === bias);

  if (bias === "neutral" || !lastEvent) {
    return `${symbol} isn't showing a clear structure break in this window, so the bias reads as neutral (${confidence}% confidence). Wait for a break above the last swing high or below the last swing low before leaning either direction.`;
  }

  const parts: string[] = [];
  parts.push(
    `${symbol} is reading ${bias} (${confidence}% confidence), driven by a ${lastEvent.type === "CHoCH" ? "change of character" : "break of structure"} that broke the ${lastEvent.direction} level at ${lastEvent.brokenLevel}.`
  );

  if (freshOB) {
    parts.push(`The nearest unmitigated ${freshOB.type} order block sits between ${freshOB.bottom} and ${freshOB.top} — a likely area to watch if price pulls back before continuing.`);
  }

  if (freshFVG) {
    parts.push(`There's also an unfilled ${freshFVG.type} fair value gap between ${freshFVG.bottom} and ${freshFVG.top} that hasn't been revisited yet.`);
  }

  parts.push(
    `This view would be invalidated by a close back through the ${lastEvent.brokenLevel} level, which would suggest the ${lastEvent.direction} break was a false one.`
  );

  return parts.join(" ");
}

/**
 * Calls the Lamatic flow for narrative synthesis if LAMATIC_API_KEY and
 * LAMATIC_FLOW_ENDPOINT are configured, otherwise uses a deterministic local
 * narrative so the kit is fully runnable out of the box.
 *
 * NOTE: the endpoint/payload shape below is illustrative. Once you build the
 * flow in Lamatic Studio, copy the exact call snippet Studio generates for
 * your project and swap it in here — Studio exposes this per-flow, and the
 * field names can differ slightly by workspace/flow version.
 */
export async function getBiasNarrative(analysis: SMCAnalysis): Promise<BiasNarrative> {
  const apiKey = process.env.LAMATIC_API_KEY;
  const endpoint = process.env.LAMATIC_FLOW_ENDPOINT;

  if (!apiKey || !endpoint) {
    return { reasoning: localFallbackNarrative(analysis), source: "fallback" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: buildBiasPrompt(analysis),
      }),
    });

    if (!res.ok) throw new Error(`Lamatic flow request failed (${res.status})`);

    const data = await res.json();
    const reasoning: string | undefined = data?.result ?? data?.output ?? data?.text;

    if (!reasoning) throw new Error("Lamatic flow response did not include a text result");

    return { reasoning, source: "lamatic" };
  } catch (err) {
    console.error("Falling back to local narrative:", err);
    return { reasoning: localFallbackNarrative(analysis), source: "fallback" };
  }
}
