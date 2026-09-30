import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "memorymend",
    version: "1.0.0",
  });
}
