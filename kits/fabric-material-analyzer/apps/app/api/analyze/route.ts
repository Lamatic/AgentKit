import { materialDB } from "../../../lib/materialDB";

function normalizeMaterial(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\d+%\s*/g, "")
    .replace(/recycled\s*/g, "")
    .trim();
}

function safeJSONParse(raw: any) {
  try {
    if (typeof raw === "object") return raw;
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
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

export async function POST(req: Request) {
  try {
    if (!process.env.LAMATIC_API_KEY) {
      return Response.json(
        { materials: [], note: "Missing API key." },
        { status: 500 }
      );
    }

    const { url } = await req.json();

    // -------- PRIMARY AI CALL --------
    const response = await fetch(
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
            question: "extract materials",
            url,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Primary API request failed");
    }

    const data = await response.json();
    const workflowResult = data?.data?.executeWorkflow?.result;

    let raw =
      workflowResult?.answer ??
      workflowResult?.output ??
      workflowResult;

    if (!raw) {
      return Response.json({
        materials: [],
        note: "No response from AI",
      });
    }

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
    const normalized = rawMaterials.map(normalizeMaterial);
    const displayMaterials = [
      ...new Set(normalized.flatMap(splitCompound)),
    ];

    const known = displayMaterials.filter((m) => materialDB[m]);
    const unknown = displayMaterials.filter((m) => !materialDB[m]);

    let ecoScore = 0;
    let skinScore = 0;
    let ecoReasons: string[] = [];
    let skinReasons: string[] = [];
    let negatives: string[] = [];

    // -------- KNOWN MATERIAL SCORING --------
    known.forEach((mat) => {
      const m = materialDB[mat];
      if (!m) return;

      if (m.biodegradable) {
        ecoScore += 30;
        ecoReasons.push(`${mat} is biodegradable`);
      } else {
        negatives.push(`${mat} is not biodegradable`);
      }

      if (m.waterUsage === "low") ecoScore += 10;
      else if (m.waterUsage === "high")
        negatives.push(`${mat} uses high water`);

      if (m.chemicalUse === "low") ecoScore += 10;
      else if (m.chemicalUse === "high")
        negatives.push(`${mat} uses heavy chemicals`);

      if (m.breathability === "high") {
        skinScore += 30;
        skinReasons.push(`${mat} is breathable`);
      }

      if (m.irritationRisk === "low") {
        skinScore += 30;
        skinReasons.push(`${mat} is skin-safe`);
      } else if (m.irritationRisk === "high") {
        negatives.push(`${mat} may irritate skin`);
      }
    });

    // -------- AI FALLBACK FOR UNKNOWN --------
    if (unknown.length > 0) {
      try {
        const aiRes = await fetch(
          "https://yashasvisorganization952-yashasvisproject443.lamatic.dev/graphql",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
              "Content-Type": "application/json",
              "x-project-id": "f16d4f23-0c7a-42df-b553-b41b1f166670",
            },
            body: JSON.stringify({
              query: `query ExecuteWorkflow($workflowId: String!, $question: String) {
                executeWorkflow(workflowId: $workflowId payload: { question: $question }) {
                  status result
                }
              }`,
              variables: {
                workflowId:
                  "55a58aab-872b-463f-94b1-e0fbfc1c2056",
                question: `Analyze these materials: ${unknown.join(
                  ", "
                )}. Return JSON only.`,
              },
            }),
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          let aiRaw =
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

    // -------- FINAL NORMALIZATION --------
    ecoScore = Math.min(100, ecoScore);
    skinScore = Math.min(100, skinScore);

    return Response.json({
      materials: displayMaterials,
      ecoScore,
      skinScore,
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