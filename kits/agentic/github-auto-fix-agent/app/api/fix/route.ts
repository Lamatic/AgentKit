import { handleFixIssue } from "@/actions/orchestrate";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.issue_url) {
      return Response.json(
        { success: false, error: "issue_url is required" },
        { status: 400 },
      );
    }

    const result = await handleFixIssue(body);

    return Response.json(result);
  } catch (error) {
    console.error("[API ERROR]", error);

    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
