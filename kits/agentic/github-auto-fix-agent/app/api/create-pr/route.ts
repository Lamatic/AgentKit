import { handleCreatePR } from "@/actions/orchestrate";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.issue_url || !body.file_path || !body.fix || !body.pr) {
      return Response.json(
        {
          success: false,
          error:
            "issue_url, file_path, fix, and pr are all required",
        },
        { status: 400 },
      );
    }

    const result = await handleCreatePR(body);

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
