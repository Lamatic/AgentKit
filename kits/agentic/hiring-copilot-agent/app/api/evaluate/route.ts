import { generateContent } from "@/actions/orchestrate";

export async function POST(req: Request) {
  try {
    const {
      job_description,
      name,
      skills,
      projects,
      education,
      certificates,
      experience_years,
    } = await req.json();

    const result = await generateContent({
      job_description,
      name,
      skills,
      projects,
      education,
      certificates,
      experience_years,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error || "Evaluation failed" },
        { status: 500 },
      );
    }

    return Response.json({
      data: result.data,
    });
  } catch (err) {
    console.error("[API evaluate error]:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
