import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWeatherSummary } from "@/lib/weather";
import { generatePackingList } from "@/lib/lamatic-client";

const TripType = z.enum(["city-break", "beach", "hiking", "business", "winter-sports"]);

const RequestSchema = z
  .object({
    destination: z.string().trim().min(1, "Destination is required."),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD."),
    tripType: TripType,
    travelers: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Traveler name cannot be empty."),
          tag: z.enum(["adult", "child"]),
        })
      )
      .min(1, "At least one traveler is required."),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate.",
    path: ["endDate"],
  });

function toPlainError(issues: z.ZodIssue[]) {
  return issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: toPlainError(parsed.error.issues) },
        { status: 400 }
      );
    }

    const { destination, startDate, endDate, tripType, travelers } = parsed.data;

    const today = new Date().toISOString().slice(0, 10);
    if (startDate < today) {
      return NextResponse.json(
        { error: "startDate must not be in the past." },
        { status: 400 }
      );
    }

    const weather = await getWeatherSummary(destination, startDate, endDate);

    const result = await generatePackingList({
      destination,
      startDate,
      endDate,
      tripType,
      travelers,
      weather,
    });

    return NextResponse.json({ weather, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
