import { NextRequest, NextResponse } from "next/server";
import { findHotels, type HotelSearchRequest } from "@/lib/hotel-client";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HotelSearchRequest;
    const { city, country, checkIn, checkOut } = body;

    if (!city || !country || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await findHotels({
      city: body.city,
      country: body.country,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      adults: body.adults || "1",
      rooms: body.rooms || "1",
      currency: body.currency || "INR",
      radius: body.radius || "10",
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
