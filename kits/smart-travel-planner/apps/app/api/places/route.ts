import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const searchRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name&key=${apiKey}`
  );
  const searchData = await searchRes.json();
  const placeId = searchData?.candidates?.[0]?.place_id;

  if (!placeId) return NextResponse.json({ photos: [] });


  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,name,geometry&key=${apiKey}`
  );
  const detailsData = await detailsRes.json();
  const photos = detailsData?.result?.photos?.slice(0, 6) ?? [];
  const location = detailsData?.result?.geometry?.location ?? null;

  
  const photoUrls = photos.map((p: { photo_reference: string }) =>
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
  );

  return NextResponse.json({
    photos: photoUrls,
    name: detailsData?.result?.name,
    location,
  });
}