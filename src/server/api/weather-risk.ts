import { NextRequest, NextResponse } from "next/server";
import {
  getModelRiskCatalog,
  resolveModelRiskKind,
  resolveModelRiskProduct,
} from "@/lib/weather/auto-risk-outlook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/weather/risk?source=bom|pulse|access|ifs|ukmo|auto&product=risk|tstorm|hail|wind|rain|tornado
 * Catalog of UK/Europe thunderstorm risk — model outlooks are live; official imagery is explicitly unavailable.
 * `auto` is accepted as a legacy alias for `pulse`. Product applies to model sources only.
 */
export async function GET(req: NextRequest) {
  const sourceParam = (req.nextUrl.searchParams.get("source") || "bom")
    .trim()
    .toLowerCase();
  const modelKind = resolveModelRiskKind(sourceParam);
  const product = resolveModelRiskProduct(
    req.nextUrl.searchParams.get("product"),
  );

  try {
    if (modelKind) {
      const force =
        req.nextUrl.searchParams.get("force") === "1" ||
        req.nextUrl.searchParams.get("refresh") === "1";
      const catalog = await getModelRiskCatalog(modelKind, { force, product });
      const cacheControl =
        catalog.status === "ok"
          ? "public, max-age=120, stale-while-revalidate=600"
          : "no-store";
      return NextResponse.json(catalog, {
        headers: { "Cache-Control": cacheControl },
      });
    }

    return NextResponse.json(
      {
        status: "unavailable",
        source: "bom" as const,
        product: "risk" as const,
        updatedAt: null,
        issuedAt: null,
        days: [],
        legend: [],
        attribution: "UK/Europe risk sources",
        message: "Official UK/Europe thunderstorm risk imagery is not yet connected.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[weather/risk]", err);
    return NextResponse.json(
      { error: "Risk outlook unavailable" },
      { status: 502 },
    );
  }
}
