import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    lat: 27.3314,
    lng: 88.6138,
    place: "Gangtok"
  });
}