import { NextRequest, NextResponse } from "next/server";
import {
  RADAR_NATIVE_MAX_ZOOM,
  RADAR_TILE_SIZE,
  extractOverzoomTile,
} from "@/lib/weather/radar-palette";
import {
  getCachedRadarTile,
  radarTileCacheKey,
  setCachedRadarTile,
} from "@/lib/weather/radar-tile-cache";

export const dynamic = "force-dynamic";

const METEOPOOL_EU_TILE_BASE =
  "https://www.meteopool.org/import/fromhetzner/data/tiles/radar-eu";

function webpResponse(
  body: Buffer,
  headers: Record<string, string>,
): NextResponse {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control":
        "public, max-age=600, stale-while-revalidate=60, immutable",
      ...headers,
    },
  });
}

function emptyWebpTile(): Buffer {
  // 1×1 transparent WebP
  return Buffer.from(
    "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7tQAAAAAAA",
    "base64",
  );
}

/**
 * Proxy MeteoPool EU radar tiles (pre-coloured WebP from OPERA composite).
 *
 * GET /api/weather/radar-tile?ts={unix}&z={z}&x={x}&y={y}
 *
 * MeteoPool restricts CORS to https://www.meteopool.org, so tiles must be
 * proxied server-side. Tiles are served as-is (already coloured WebP, 512px,
 * max native zoom 8).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ts = sp.get("ts") ?? "";
  const z = sp.get("z");
  const x = sp.get("x");
  const y = sp.get("y");

  if (!/^\d{10}$/.test(ts)) {
    return NextResponse.json({ error: "Invalid or missing ts" }, { status: 400 });
  }
  if (z == null || x == null || y == null) {
    return NextResponse.json({ error: "Missing z/x/y" }, { status: 400 });
  }
  const zi = Number(z);
  const xi = Number(x);
  const yi = Number(y);
  if (
    !Number.isInteger(zi) ||
    !Number.isInteger(xi) ||
    !Number.isInteger(yi) ||
    zi < 0 ||
    zi > 22 ||
    xi < 0 ||
    yi < 0
  ) {
    return NextResponse.json({ error: "Invalid tile coords" }, { status: 400 });
  }

  const overzoom = zi > RADAR_NATIVE_MAX_ZOOM;
  const scale = overzoom ? 2 ** (zi - RADAR_NATIVE_MAX_ZOOM) : 1;
  const fetchZ = overzoom ? RADAR_NATIVE_MAX_ZOOM : zi;
  const fetchX = overzoom ? Math.floor(xi / scale) : xi;
  const fetchY = overzoom ? Math.floor(yi / scale) : yi;

  const cacheKey = radarTileCacheKey(ts, "", zi, xi, yi);
  const cached = getCachedRadarTile(cacheKey);
  if (cached) {
    return webpResponse(cached, {
      "X-Radar-Cache": "HIT",
      "X-Radar-Source": "meteopool-eu",
      "X-Radar-Tile-Size": String(RADAR_TILE_SIZE),
      "X-Radar-Native-Z": String(fetchZ),
    });
  }

  const parentKey = radarTileCacheKey(ts, "", fetchZ, fetchX, fetchY);
  let parentTile = getCachedRadarTile(parentKey);

  if (!parentTile) {
    const upstream = `${METEOPOOL_EU_TILE_BASE}/${ts}/${fetchZ}/${fetchX}/${fetchY}.webp`;
    try {
      const res = await fetch(upstream, {
        headers: {
          Accept: "image/webp",
          "User-Agent": "Thunderstate/1.0",
          Referer: "https://www.meteopool.org/",
        },
        cache: "force-cache",
        next: { revalidate: 600 },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Upstream ${res.status}` },
          { status: res.status === 404 ? 404 : 502 },
        );
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 50) {
        // Too small to be a real tile — treat as empty
        setCachedRadarTile(parentKey, emptyWebpTile());
        setCachedRadarTile(cacheKey, emptyWebpTile());
        return webpResponse(emptyWebpTile(), {
          "X-Radar-Cache": "MISS",
          "X-Radar-Source": "meteopool-empty",
          "X-Radar-Tile-Size": String(RADAR_TILE_SIZE),
          "X-Radar-Native-Z": String(fetchZ),
        });
      }
      parentTile = buf;
      setCachedRadarTile(parentKey, parentTile);
    } catch (err) {
      console.error("[weather/radar-tile]", err);
      return NextResponse.json(
        { error: "Radar tile unavailable" },
        { status: 502 },
      );
    }
  }

  const out = overzoom
    ? await extractOverzoomTile(parentTile, scale, xi, yi).catch(() =>
        emptyWebpTile(),
      )
    : parentTile;
  setCachedRadarTile(cacheKey, out);
  return webpResponse(out, {
    "X-Radar-Cache": "MISS",
    "X-Radar-Source": "meteopool-eu",
    "X-Radar-Tile-Size": String(RADAR_TILE_SIZE),
    "X-Radar-Native-Z": String(fetchZ),
    "X-Radar-Overzoom": overzoom ? String(scale) : "1",
  });
}
