import { materialDB } from '../../../lib/materialDB';

function normalizeMaterial(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\d+%\s*/g, '')
    .replace(/recycled\s*/g, '')
    .trim();
}

export async function POST(req: Request) {
  try {
    if (!process.env.LAMATIC_API_KEY) {
      return Response.json({ materials: [], note: "Missing API key." }, { status: 500 });
    }

    const { url } = await req.json();

    // scrape and extract materials via Lamatic flow
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

    const data = await response.json();
    const workflowResult = data?.data?.executeWorkflow?.result;
    let raw = workflowResult?.answer ?? workflowResult?.output ?? workflowResult;

    if (!raw) return Response.json({ materials: [], note: "No response from AI" });

    let parsed: any;
    if (typeof raw === "object") {
      parsed = raw;
    } else {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    }

    const rawMaterials: string[] = parsed.materials || [];

    if (rawMaterials.length === 0) {
      return Response.json({
        materials: [],
        note: parsed.note || "This manufacturer has not disclosed the materials used in this product.",
      });
    }

    // normalize material names

    function splitCompound(mat: string): string[] {
      const compounds: Record<string, string[]> = {
        "viscose rayon": ["viscose", "rayon"],
        "rayon viscose": ["viscose", "rayon"],
      };
      return compounds[mat] || [mat];
    }
    const normalized = rawMaterials.map(normalizeMaterial);
    const displayMaterials = [...new Set(normalized.flatMap(splitCompound))];

    // split into known (in DB) and unknown
    const known = displayMaterials.filter(m => materialDB[m]);
    const unknown = displayMaterials.filter(m => !materialDB[m]);

    let ecoScore = 0;
    let skinScore = 0;
    let ecoReasons: string[] = [];
    let skinReasons: string[] = [];
    let negatives: string[] = [];

    // score known materials from DB
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
      else if (m.waterUsage === "high") negatives.push(`${mat} requires high water usage in production`);

      if (m.chemicalUse === "low") ecoScore += 10;
      else if (m.chemicalUse === "high") negatives.push(`${mat} involves heavy chemical processing`);

      if (m.breathability === "high") {
        skinScore += 30;
        skinReasons.push(`${mat} is highly breathable`);
      }

      if (m.irritationRisk === "low") {
        skinScore += 30;
        skinReasons.push(`${mat} has low irritation risk`);
      } else if (m.irritationRisk === "high") {
        negatives.push(`${mat} has high skin irritation risk`);
      }
    });

    // AI fallback for unknown materials
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
                workflowId: "55a58aab-872b-463f-94b1-e0fbfc1c2056",
                question: `Analyze these textile materials for environmental and skin impact: ${unknown.join(", ")}.
Return ONLY this JSON with no explanation:
{
  "ecoScore": <number 0-50>,
  "skinScore": <number 0-60>,
  "ecoReasons": ["reason1"],
  "skinReasons": ["reason1"],
  "negatives": ["concern1"]
}`,
              },
            }),
          }
        );

        const aiData = await aiRes.json();
        let aiRaw = aiData?.data?.executeWorkflow?.result?.answer;

        if (aiRaw) {
          if (typeof aiRaw !== "object") {
            aiRaw = JSON.parse(aiRaw.replace(/```json|```/g, "").trim());
          }
          ecoScore += aiRaw.ecoScore || 0;
          skinScore += aiRaw.skinScore || 0;
          ecoReasons.push(...(aiRaw.ecoReasons || []));
          skinReasons.push(...(aiRaw.skinReasons || []));
          negatives.push(...(aiRaw.negatives || []));
        }
      } catch { }
    }

    // normalize scores
    const total = known.length + unknown.length || 1;
    ecoScore = Math.min(100, Math.round(ecoScore / total));
    skinScore = Math.min(100, Math.round(skinScore / total));

    return Response.json({
      materials: displayMaterials,
      ecoScore,
      skinScore,
      ecoReasons,
      skinReasons,
      negatives,
    });

  } catch (e) {
    console.error(e);
    return Response.json({ materials: [], note: "Internal server error" }, { status: 500 });
  }
}