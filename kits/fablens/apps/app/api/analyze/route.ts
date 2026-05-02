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
  return fetch(
    "https://yashasvisorganization952-yashasvisproject443.lamatic.dev/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": "f16d4f23-0c7a-42df-b553-b41b1f166670",
      },
      body: JSON.stringify({
        query: `query ExecuteWorkflow($workflowId: String!, $question: String, $url: String) {
          executeWorkflow(workflowId: $workflowId payload: { question: $question url: $url }) {
            status result
          }
        }`,
        variables: {
          workflowId: "55a58aab-872b-463f-94b1-e0fbfc1c2056",
          question,
          url,
        },
      }),
    }
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.LAMATIC_API_KEY) {
      return Response.json(
        { materials: [], note: "Missing API key." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const url = body?.url;

    if (!url) {
      return Response.json(
        { materials: [], note: "Invalid URL input" },
        { status: 400 }
      );
    }

    // -------- PRIMARY CALL --------
    const response = await callLamatic("extract materials", url);

    if (!response.ok) {
      throw new Error("Primary API request failed");
    }

    const data = await response.json();
    const workflowResult = data?.data?.executeWorkflow?.result;

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

    const rawMaterials: string[] =
      parsed.materials ||
      parsed.fabric ||
      parsed.textiles ||
      [];

    if (rawMaterials.length === 0) {
      return Response.json({
        materials: [],
        note:
          parsed.note ||
          "This manufacturer has not disclosed materials.",
      });
    }

    // -------- NORMALIZATION --------
    const displayMaterials = [
      ...new Set(
        rawMaterials
          .map(normalizeMaterial)
          .flatMap(splitCompound)
      ),
    ];

    const known = displayMaterials.filter((m) => materialDB[m]);
    const unknown = displayMaterials.filter((m) => !materialDB[m]);

    let ecoScore = 0;
    let skinScore = 0;
    const ecoReasons: string[] = [];
    const skinReasons: string[] = [];
    const negatives: string[] = [];

    // -------- KNOWN MATERIALS --------
    for (const mat of known) {
      const m = materialDB[mat];
      if (!m) continue;

      if (m.biodegradable) {
        ecoScore += 30;
        ecoReasons.push(`${mat} is biodegradable`);
      } else {
        negatives.push(`${mat} is not biodegradable`);
      }

      if (m.waterUsage === "low") ecoScore += 10;
      if (m.waterUsage === "high")
        negatives.push(`${mat} uses high water`);

      if (m.chemicalUse === "low") ecoScore += 10;
      if (m.chemicalUse === "high")
        negatives.push(`${mat} uses heavy chemicals`);

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
    if (unknown.length > 0) {
      try {
        const aiRes = await callLamatic(
          `Analyze these materials: ${unknown.join(", ")}. Return JSON only.`
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const aiRaw =
            aiData?.data?.executeWorkflow?.result?.answer;

          const parsedAI = safeJSONParse(aiRaw);

          if (parsedAI) {
            ecoScore += parsedAI.ecoScore || 0;
            skinScore += parsedAI.skinScore || 0;
            ecoReasons.push(...(parsedAI.ecoReasons || []));
            skinReasons.push(...(parsedAI.skinReasons || []));
            negatives.push(...(parsedAI.negatives || []));
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
      { materials: [], note: "Internal server error" },
      { status: 500 }
    );
  }
}