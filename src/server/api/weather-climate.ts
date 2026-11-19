import { NextRequest, NextResponse } from "next/server";
import { fetchClimateOutlook } from "@/lib/weather/climate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat") || 51.5074);
    const lon = Number(url.searchParams.get("lon") || -0.1278);
    const placeLabel = url.searchParams.get("place") || "London";
    const days = Number(url.searchParams.get("days") || "16");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    const payload = await fetchClimateOutlook({
      latitude: lat,
      longitude: lon,
      placeLabel,
      days: Number.isFinite(days) ? days : 16,
    });
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Climate outlook unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
