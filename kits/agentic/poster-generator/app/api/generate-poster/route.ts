import { NextResponse } from "next/server"
import { z } from "zod"

import { lamaticEnv } from "@/app/utils"

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required").max(5000),
})

const flowResultSchema = z.object({
  status: z.string(),
  html_code: z.string().min(1),
  poster_name: z.string().min(1),
})

const executeWorkflowSchema = z.object({
  status: z.string(),
  result: flowResultSchema,
})

const graphQLResponseSchema = z.object({
  data: z
    .object({
      executeWorkflow: executeWorkflowSchema,
    })
    .nullable()
    .optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      })
    )
    .optional(),
})

function normalizePosterResponse(parsedResult: z.infer<typeof flowResultSchema>) {

  const status = parsedResult.status.trim().toLowerCase()
  const statusIsComplete = status === "complete" || status === "success"

  return {
    is_valid: statusIsComplete,
    validation_issues: statusIsComplete
      ? []
      : [`Lamatic flow returned status "${parsedResult.status}".`],
    html_code: parsedResult.html_code,
    poster_name: parsedResult.poster_name,
    design_spec: null,
    intent: null,
  }
}

export async function POST(request: Request) {
  try {
    const parsedInput = requestSchema.parse(await request.json())

    const lamaticResponse = await fetch(lamaticEnv.LAMATIC_PROJECT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lamaticEnv.LAMATIC_PROJECT_API_KEY}`,
        "Content-Type": "application/json",
        "x-project-id": lamaticEnv.LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({
        query: `query ExecuteWorkflow($workflowId: String!, $user_input: String) {
  executeWorkflow(workflowId: $workflowId, payload: { user_input: $user_input }) {
    status
    result
  }
}`,
        variables: {
          workflowId: lamaticEnv.LAMATIC_FLOW_ID,
          user_input: parsedInput.prompt,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!lamaticResponse.ok) {
      throw new Error(`Lamatic request failed with status ${lamaticResponse.status}`)
    }

    const rawPayload: unknown = await lamaticResponse.json()
    const payload = graphQLResponseSchema.parse(rawPayload)

    if (payload.errors && payload.errors.length > 0) {
      return NextResponse.json(
        {
          is_valid: false,
          validation_issues: payload.errors.map((item) => item.message),
          poster_name: "poster",
          design_spec: null,
          intent: null,
        },
        { status: 500 }
      )
    }

    if (!payload.data?.executeWorkflow) {
      return NextResponse.json(
        {
          is_valid: false,
          validation_issues: ["Lamatic response did not include executeWorkflow data."],
          poster_name: "poster",
          design_spec: null,
          intent: null,
        },
        { status: 500 }
      )
    }

    const normalized = normalizePosterResponse(payload.data.executeWorkflow.result)
    return NextResponse.json(normalized)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          is_valid: false,
          validation_issues: error.issues.map((issue) => issue.message),
          poster_name: "poster",
          design_spec: null,
          intent: null,
        },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : "Failed to generate poster"

    return NextResponse.json(
      {
        is_valid: false,
        validation_issues: [message],
        poster_name: "poster",
        design_spec: null,
        intent: null,
      },
      { status: 500 }
    )
  }
}