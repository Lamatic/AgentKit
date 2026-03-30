import { NextRequest, NextResponse } from "next/server"

const query = `
  query ExecuteWorkflow(
    $workflowId: String!
    $owner: String
    $repo: String
    $pr_number: String
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        owner: $owner
        repo: $repo
        pr_number: $pr_number
      }
    ) {
      status
      result
    }
  }
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const owner = typeof body?.owner === "string" ? body.owner.trim() : ""
    const repo = typeof body?.repo === "string" ? body.repo.trim() : ""
    const pr_number =
      typeof body?.pr_number === "string" ? body.pr_number.trim() : ""

    if (!owner || !repo || !pr_number) {
      return NextResponse.json(
        { error: "Owner, repo, and PR number are required." },
        { status: 400 }
      )
    }

    if (!process.env.LAMATIC_API_KEY) {
      return NextResponse.json(
        { error: "LAMATIC_API_KEY is not configured on the server." },
        { status: 500 }
      )
    }

    const res = await fetch(
      "https://soumiksorganization573-codereviewagent135.lamatic.dev/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
          "Content-Type": "application/json",
          "x-project-id": "4da47f5c-f38d-4519-89b3-82feda6e81ab",
        },
        body: JSON.stringify({
          query,
          variables: {
            workflowId: "597871bb-6b0b-4cef-9771-05514dee60cd",
            owner,
            repo,
            pr_number,
          },
        }),
      }
    )

    const raw = await res.text()
    const trimmed = raw.trim()
    let data: any = null

    if (trimmed) {
      try {
        data = JSON.parse(trimmed)
      } catch {
        data = null
      }
    }

    if (!res.ok) {
      const upstreamMessage =
        data?.errors?.map((error: any) => error?.message).filter(Boolean).join("; ") ||
        data?.message ||
        (trimmed.startsWith("<")
          ? "Lamatic returned HTML instead of JSON."
          : "Lamatic returned an unsuccessful response.")

      console.error("Lamatic workflow request failed", {
        status: res.status,
        message: upstreamMessage,
      })

      return NextResponse.json(
        { error: `Lamatic request failed (${res.status}): ${upstreamMessage}` },
        { status: 502 }
      )
    }

    if (!data || typeof data !== "object") {
      console.error("Lamatic returned a non-JSON response", {
        status: res.status,
      })

      return NextResponse.json(
        { error: "Lamatic returned an invalid non-JSON response." },
        { status: 502 }
      )
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const message = data.errors
        .map((error: any) => error?.message)
        .filter(Boolean)
        .join("; ")

      console.error("Lamatic GraphQL errors", { message })

      return NextResponse.json(
        { error: message || "Lamatic returned GraphQL errors." },
        { status: 502 }
      )
    }

    const result = data?.data?.executeWorkflow?.result

    return NextResponse.json({
      bugs: Array.isArray(result?.bugs) ? result.bugs : [],
      security: Array.isArray(result?.security) ? result.security : [],
      style: Array.isArray(result?.style) ? result.style : [],
      summary: typeof result?.summary === "string" ? result.summary : "",
    })
  } catch (error) {
    console.error("Review route failed", error)

    return NextResponse.json(
      { error: "The review route failed before it could complete the request." },
      { status: 500 }
    )
  }
}
