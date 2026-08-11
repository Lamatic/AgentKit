import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchUserRepositories } from "@/lib/github/repos";

const VALID_SORT_VALUES = new Set(["updated", "created", "pushed", "full_name"]);

export async function GET(request: NextRequest) {
  // 1. Retrieve authenticated session
  const session = await getSession();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized. Please connect your GitHub account." },
      { status: 401 }
    );
  }

  // 2. Parse and validate query parameters
  const url = new URL(request.url);

  const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const rawPerPage = parseInt(url.searchParams.get("per_page") || "30", 10);
  const perPage = isNaN(rawPerPage) ? 30 : Math.min(100, Math.max(1, rawPerPage));

  const rawSort = url.searchParams.get("sort") || "updated";
  const sort = VALID_SORT_VALUES.has(rawSort)
    ? (rawSort as "updated" | "created" | "pushed" | "full_name")
    : "updated";

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
