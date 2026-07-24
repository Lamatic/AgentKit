import { z } from "zod";

const inputSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function handleEcho(request: Request, secret: string | undefined) {
  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return json(
      {
        error: {
          code: "unauthorized",
          message: "Valid runtime authorization is required.",
        },
      },
      401,
    );
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return json(
      {
        error: {
          code: "invalid_input",
          message: "A non-empty message of at most 500 characters is required.",
        },
      },
      400,
    );
  }

  return json(
    {
      ok: true,
      tool: "echo",
      input: parsed.data,
      traceId: `spike_${crypto.randomUUID()}`,
      observedAt: new Date().toISOString(),
    },
    200,
  );
}
