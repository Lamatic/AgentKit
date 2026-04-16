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

type LamaticIssue = {
  message?: string
}

type LamaticExecuteWorkflowResult = {
  bugs?: unknown
  security?: unknown
  style?: unknown
  summary?: unknown
}

type LamaticGraphqlResponse = {
  data?: {
    executeWorkflow?: {
      result?: LamaticExecuteWorkflowResult
    }
  }
  errors?: LamaticIssue[]
  message?: string
}

function getGraphqlUrl(apiUrl: string) {
  const trimmed = apiUrl.trim().replace(/\/+$/, "")
  return trimmed.endsWith("/graphql") ? trimmed : `${trimmed}/graphql`
}

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

    const lamaticApiKey = process.env.LAMATIC_API_KEY?.trim()
    const lamaticApiUrl = process.env.LAMATIC_API_URL?.trim()
    const lamaticProjectId = process.env.LAMATIC_PROJECT_ID?.trim()
    const workflowId = process.env.AGENTIC_GENERATE_CONTENT?.trim()

    const missingEnv = [
      !lamaticApiKey && "LAMATIC_API_KEY",
      !lamaticApiUrl && "LAMATIC_API_URL",
      !lamaticProjectId && "LAMATIC_PROJECT_ID",
      !workflowId && "AGENTIC_GENERATE_CONTENT",
    ].filter(Boolean)

    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required Lamatic environment variables: ${missingEnv.join(
            ", "
          )}.`,
        },
        { status: 500 }
      )
    }

    const res = await fetch(getGraphqlUrl(lamaticApiUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lamaticApiKey}`,
        "Content-Type": "application/json",
        "x-project-id": lamaticProjectId,
      },
      body: JSON.stringify({
        query,
        variables: {
          workflowId,
          owner,
          repo,
          pr_number,
        },
      }),
    })

    const raw = await res.text()
    const trimmed = raw.trim()
    let data: LamaticGraphqlResponse | null = null

    if (trimmed) {
      try {
        data = JSON.parse(trimmed)
      } catch {
        data = null
      }
    }

    if (!res.ok) {
      const upstreamMessage =
        data?.errors
          ?.map((error) => error.message)
          .filter(Boolean)
          .join("; ") ||
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
        .map((error) => error.message)
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
