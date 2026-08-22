import { NextResponse } from "next/server";

import { runLamaticMigrationAnalysis } from "@/lib/lamatic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sql?: unknown;
    } | null;

    const sql = typeof body?.sql === "string" ? body.sql.trim() : "";

    if (!sql) {
      return NextResponse.json({ error: "SQL is required." }, { status: 400 });
    }

    const analysis = await runLamaticMigrationAnalysis(sql);

    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration analysis failed.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
