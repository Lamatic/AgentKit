import { NextResponse } from "next/server";

import { runLamaticMigrationAnalysis } from "@/lib/lamatic";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SQL_LENGTH = 20_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sql?: unknown;
    } | null;

    const sql = typeof body?.sql === "string" ? body.sql.trim() : "";

    if (!sql) {
      return NextResponse.json({ error: "SQL is required." }, { status: 400 });
    }

    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { error: `SQL migration must be ${MAX_SQL_LENGTH.toLocaleString()} characters or fewer.` },
        { status: 413 },
      );
    }

    const analysis = await runLamaticMigrationAnalysis(sql);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Migration analysis failed", error);

    return NextResponse.json({ error: "Migration analysis failed." }, { status: 502 });
  }
}
