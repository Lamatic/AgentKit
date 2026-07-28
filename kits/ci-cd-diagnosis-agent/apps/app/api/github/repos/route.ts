import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchUserRepositories } from "@/lib/github/repos";

export async function GET(request: NextRequest) {
  // 1. Retrieve authenticated session
  const session = await getSession();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized. Please connect your GitHub account." },
      { status: 401 }
    );
  }

  // 2. Parse query parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("per_page") || "100", 10);
  const sort = (url.searchParams.get("sort") || "updated") as "updated" | "created" | "pushed" | "full_name";

  // 3. Fetch user repositories using encrypted session token
  const result = await fetchUserRepositories({
    accessToken: session.accessToken,
    page,
    perPage,
    sort,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result);
}
