import { NextResponse } from "next/server";
import { reverseGeocodeAddress } from "../../../lib/location-reverse";

function parseNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = parseNumber(url.searchParams.get("lat"));
  const longitude = parseNumber(url.searchParams.get("lon"));

  if (latitude == null || longitude == null) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const address = await reverseGeocodeAddress(latitude, longitude);
  return NextResponse.json({ address });
}
