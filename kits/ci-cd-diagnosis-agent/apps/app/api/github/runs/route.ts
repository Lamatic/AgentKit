import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchRepositoryWorkflowRuns } from "@/lib/github/workflows";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized. Session expired." }, { status: 401 });
  }

  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const workflowId = url.searchParams.get("workflow_id") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const branch = url.searchParams.get("branch") || undefined;
  const event = url.searchParams.get("event") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("per_page") || "30", 10);

  if (!owner || !repo) {
    return NextResponse.json({ error: "Owner and repo query parameters are required." }, { status: 400 });
  }

  const result = await fetchRepositoryWorkflowRuns({
    accessToken: session.accessToken,
    owner,
    repo,
    workflowId,
    status,
    branch,
    event,
    page,
    perPage,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
