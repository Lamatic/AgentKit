import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { lamaticClient, FLOW_ID } from "@/lib/lamatic-client";

type AIResponse = {
  sql: string | null;
  template: string | null;
  errorMessage: string;
};
type ContextMessage = { role: string; content: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callLamatic(payload: object, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await lamaticClient.executeFlow(FLOW_ID, payload);
      if (res?.status === "error") {
        const msg = res?.message ?? "";
        if (msg.includes("503") && attempt < retries) {
          await sleep(5000);
          continue;
        }
        if (msg.includes("503"))
          throw new Error("AI is overloaded. Please try again.");
        if (msg.includes("429"))
          throw new Error("AI quota exceeded. Please try again later.");
      }
      return res;
    } catch (e: any) {
      if (
        attempt < retries &&
        (e.message?.includes("503") || e.message?.includes("fetch"))
      ) {
        await sleep(5000);
        continue;
      }
      throw e;
    }
  }
}

function parseAIResponse(raw: any): AIResponse {
  const gr =
    raw?.result?.generatedResponse ??
    raw?.generatedResponse ??
    raw?.output?.generatedResponse ??
    raw?.data?.generatedResponse;

  if (!gr) throw new Error("Empty response from AI");
  if (typeof gr === "object") return gr as AIResponse;
  if (typeof gr === "string") {
    return JSON.parse(
      gr
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim(),
    );
  }
  throw new Error("Unexpected response format");
}

function buildSchema(
  rows: { table_name: string; column_name: string; data_type: string }[],
): string {
  const map: Record<string, string[]> = {};
  for (const r of rows) {
    (map[r.table_name] ??= []).push(
      `  ${r.column_name} ${r.data_type.toUpperCase()}`,
    );
  }
  return Object.entries(map)
    .map(([t, cols]) => `TABLE ${t} (\n${cols.join(",\n")}\n)`)
    .join("\n\n");
}

function buildAnswer(
  template: string | null,
  rows: Record<string, any>[],
): string {
  if (rows.length === 1) {
    return (template ?? "").replace(/\{(subject|value|detail)\}/g, (_, k) =>
      rows[0][k] !== undefined ? String(rows[0][k]) : `{${k}}`,
    );
  }
  const list = rows
    .map((r, i) => {
      const s = r["subject"] ?? String(Object.values(r)[0]);
      const d = r["detail"] !== undefined ? ` — ${r["detail"]}` : "";
      return `${i + 1}. ${s}${d}`;
    })
    .join("\n");
  return template ? `${template}\n\n${list}` : list;
}

export async function POST(req: NextRequest) {
  const { question, connectionUrl, context = [] } = await req.json();
  const dbUrl = connectionUrl || process.env.DATABASE_URL;

  if (!question?.trim() || !dbUrl) {
    return NextResponse.json(
      { error: "Missing question or database connection." },
      { status: 400 },
    );
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  let schema: string;
  try {
    const { rows } = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    schema = buildSchema(rows);
  } catch {
    await pool.end();
    return NextResponse.json(
      { error: "Could not connect to database." },
      { status: 500 },
    );
  }

  const contextSummary = (context as ContextMessage[]).length
    ? context
        .map(
          (m: ContextMessage) =>
            `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
        )
        .join("\n")
    : null;

  let raw: any;
  try {
    raw = await callLamatic({
      question,
      schema,
      ...(contextSummary && { context: contextSummary }),
    });
  } catch (e: any) {
    await pool.end();
    return NextResponse.json(
      { error: e.message ?? "AI call failed." },
      { status: 503 },
    );
  }

  let parsed: AIResponse;
  try {
    parsed = parseAIResponse(raw);
  } catch (e: any) {
    await pool.end();
    return NextResponse.json(
      { error: `Failed to parse AI response: ${e.message}` },
      { status: 500 },
    );
  }

  if (!parsed.sql) {
    await pool.end();
    return NextResponse.json({ answer: parsed.errorMessage });
  }

  try {
    const { rows } = await pool.query(parsed.sql);
    await pool.end();

    if (!rows.length) return NextResponse.json({ answer: parsed.errorMessage });

    return NextResponse.json({ answer: buildAnswer(parsed.template, rows) });
  } catch (e: any) {
    await pool.end();
    console.error("[SQL Error]", e.message);
    return NextResponse.json(
      { error: `Query failed: ${e.message}` },
      { status: 500 },
    );
  }
}
