import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

/**
 * GET /api/forecast
 * UK/Europe thunderstorm outlook endpoint.
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: "unavailable",
      issuedAt: null,
      days: [],
      message: "Official UK/Europe thunderstorm risk imagery is not yet connected.",
    }, {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[forecast]", error);
    return NextResponse.json(
      { error: "UK/Europe risk outlook unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
