import { NextResponse } from "next/server";
import { optimizePrompt } from "@/actions/orchestrate";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await optimizePrompt(prompt);

  return NextResponse.json(result);
}