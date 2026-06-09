import { materialDB } from "../../../lib/materialDB";

function normalizeMaterial(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\d+%\s*/g, "")
    .replace(/recycled\s*/g, "")
    .trim();
}

function safeJSONParse(raw: unknown) {
  if (!raw) return null;

  try {
    if (typeof raw === "object") return raw;

    if (typeof raw === "string") {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    }

    return null;
  } catch {
    return null;
  }
}

function splitCompound(mat: string): string[] {
  const compounds: Record<string, string[]> = {
    "viscose rayon": ["viscose", "rayon"],
    "rayon viscose": ["viscose", "rayon"],
  };

  return compounds[mat] || [mat];
}

async function callLamatic(question: string, url?: string) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  const host = process.env.LAMATIC_HOST;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const workflowId = process.env.LAMATIC_WORKFLOW_ID;

  if (!host || !projectId || !workflowId) {
    throw new Error("Missing Lamatic env configuration");
  }

  try {
    return await fetch(host, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": projectId,
      },
      body: JSON.stringify({
        query: `
          query ExecuteWorkflow(
            $workflowId: String!,
            $question: String,
            $url: String
          ) {
            executeWorkflow(
              workflowId: $workflowId
              payload: {
                question: $question
                url: $url
              }
            ) {
              status
              result
            }
          }
        `,
        variables: {
          workflowId,
          question,
          url,
        },
      }),
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Analyze clothing product materials using Lamatic AI.
 */
export async function POST(req: Request) {
  try {
    if (!process.env.LAMATIC_API_KEY) {
      return Response.json(
        {
          materials: [],
          note: "Missing API key.",
        },
        {
          status: 500,
        }
      );
    }

    const body = await req.json().catch(() => null);

    const inputUrl = body?.url;

    // -------- URL VALIDATION --------
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(inputUrl);

      if (
        !["http:", "https:"].includes(parsedUrl.protocol)
      ) {
        throw new Error();
      }
    } catch {
      return Response.json(
        {
          materials: [],
          note: "Invalid URL input",
        },
        {
          status: 400,
        }
      );
    }

    // -------- PRIMARY AI CALL --------
    const response = await callLamatic(
      "extract materials",
      parsedUrl.href
    );

    if (!response.ok) {
      throw new Error("Primary API request failed");
    }

    const data = await response.json();

    const workflowResult =
      data?.data?.executeWorkflow?.result;

    const raw =
      workflowResult?.answer ??
      workflowResult?.output ??
      workflowResult;

    const parsed = safeJSONParse(raw);

    if (!parsed) {
      return Response.json({
        materials: [],
        note: "Failed to parse AI response",
      });
    }

    // -------- SAFE MATERIAL EXTRACTION --------
    let rawMaterials: string[] = [];

    const candidates = [
      parsed.materials,
      parsed.fabric,
      parsed.textiles,
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) {
        rawMaterials = c;
        break;
      }

      if (typeof c === "string") {
        rawMaterials = c
          .split(",")
          .map((s) => s.trim());

        break;
      }
    }

 if (rawMaterials.length === 0) {
  const note =
    typeof parsed.note === "string" && parsed.note.trim()
      ? parsed.note
      : "This manufacturer has not disclosed materials.";

  return Response.json({
    materials: [],
    note,
  });
}

    // -------- NORMALIZATION --------
    const displayMaterials = [
      ...new Set(
        rawMaterials
          .map(normalizeMaterial)
          .flatMap(splitCompound)
          .filter(Boolean)
      ),
    ];

    // -------- KNOWN / UNKNOWN --------
    const known = displayMaterials.filter(
      (m) => materialDB[m]
    );

    const unknown = displayMaterials.filter(
      (m) => !materialDB[m]
    );

    // -------- SAFE UNKNOWN SANITIZATION --------
    const safeUnknown = unknown.filter(
      (m) =>
        typeof m === "string" &&
        m.length <= 50 &&
        /^[a-zA-Z\s-]+$/.test(m)
    );

    let ecoScore = 0;
    let skinScore = 0;

    const ecoReasons: string[] = [];
    const skinReasons: string[] = [];
    const negatives: string[] = [];

    // -------- KNOWN MATERIAL ANALYSIS --------
    for (const mat of known) {
      const m = materialDB[mat];

      if (!m) continue;

      if (m.biodegradable) {
        ecoScore += 30;
        ecoReasons.push(`${mat} is biodegradable`);
      } else {
        negatives.push(`${mat} is not biodegradable`);
      }

      if (m.waterUsage === "low") {
        ecoScore += 10;
      }

      if (m.waterUsage === "high") {
        negatives.push(`${mat} uses high water`);
      }

      if (m.chemicalUse === "low") {
        ecoScore += 10;
      }

      if (m.chemicalUse === "high") {
        negatives.push(`${mat} uses heavy chemicals`);
      }

      if (m.breathability === "high") {
        skinScore += 30;
        skinReasons.push(`${mat} is breathable`);
      }

      if (m.irritationRisk === "low") {
        skinScore += 30;
        skinReasons.push(`${mat} is skin-safe`);
      }

      if (m.irritationRisk === "high") {
        negatives.push(`${mat} may irritate skin`);
      }
    }

    // -------- AI FALLBACK --------
    if (safeUnknown.length > 0) {
      try {
        const aiRes = await callLamatic(
          `Analyze these materials: ${safeUnknown.join(
            ", "
          )}. Return JSON only.`
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();

          const aiRaw =
            aiData?.data?.executeWorkflow?.result
              ?.answer;

          const parsedAI = safeJSONParse(aiRaw);

          if (parsedAI) {
            const aiEco =
              typeof parsedAI.ecoScore === "number"
                ? parsedAI.ecoScore
                : 0;

            const aiSkin =
              typeof parsedAI.skinScore === "number"
                ? parsedAI.skinScore
                : 0;

            ecoScore += aiEco;
            skinScore += aiSkin;

            if (Array.isArray(parsedAI.ecoReasons)) {
              ecoReasons.push(
                ...parsedAI.ecoReasons.filter(
                  (r: unknown): r is string =>
                    typeof r === "string"
                )
              );
            }

            if (Array.isArray(parsedAI.skinReasons)) {
              skinReasons.push(
                ...parsedAI.skinReasons.filter(
                  (r: unknown): r is string =>
                    typeof r === "string"
                )
              );
            }

            if (Array.isArray(parsedAI.negatives)) {
              negatives.push(
                ...parsedAI.negatives.filter(
                  (n: unknown): n is string =>
                    typeof n === "string"
                )
              );
            }
          }
        }
      } catch (err) {
        console.error("AI fallback failed:", err);
      }
    }

    return Response.json({
      materials: displayMaterials,
      ecoScore: Math.min(100, ecoScore),
      skinScore: Math.min(100, skinScore),
      ecoReasons,
      skinReasons,
      negatives,
    });
  } catch (err) {
    console.error("API ERROR:", err);

    return Response.json(
      {
        materials: [],
        note: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}