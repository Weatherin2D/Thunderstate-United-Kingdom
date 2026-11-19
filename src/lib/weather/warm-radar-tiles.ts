/**
 * Server-side radar tile warm — fetch MeteoPool EU tiles into the process
 * cache so the first client paint is a cache hit.
 */

import {
  RADAR_NATIVE_MAX_ZOOM,
  type RadarWarmupBounds,
} from "@/lib/weather/radar-palette";
import {
  getCachedRadarTile,
  radarTileCacheKey,
  setCachedRadarTile,
} from "@/lib/weather/radar-tile-cache";
import { allowBackgroundWarm } from "@/lib/runtime-budget";

const UK_BOUNDS: RadarWarmupBounds = {
  south: 49,
  west: -11,
  north: 61,
  east: 3,
};

const METEOPOOL_EU_TILE_BASE =
  "https://www.meteopool.org/import/fromhetzner/data/tiles/radar-eu";

const DEG2RAD = Math.PI / 180;

function lonToTileX(lon: number, z: number): number {
  const n = 2 ** z;
  return ((lon + 180) / 360) * n;
}

function latToTileY(lat: number, z: number): number {
  const n = 2 ** z;
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = clamped * DEG2RAD;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  );
}

function tileRange(
  z: number,
  bounds: RadarWarmupBounds,
  maxTiles: number,
): { x: number; y: number }[] {
  if (z < 0 || z > RADAR_NATIVE_MAX_ZOOM) return [];
  const n = 2 ** z;
  let x0 = Math.floor(lonToTileX(bounds.west, z)) - 1;
  let x1 = Math.ceil(lonToTileX(bounds.east, z)) + 1;
  let y0 = Math.floor(latToTileY(bounds.north, z)) - 1;
  let y1 = Math.ceil(latToTileY(bounds.south, z)) + 1;
  x0 = Math.max(0, x0);
  x1 = Math.min(n - 1, x1);
  y0 = Math.max(0, y0);
  y1 = Math.min(n - 1, y1);

  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  if (width * height > maxTiles) {
    const maxSide = Math.max(1, Math.floor(Math.sqrt(maxTiles)));
    const cx = Math.floor((x0 + x1) / 2);
    const cy = Math.floor((y0 + y1) / 2);
    const half = Math.floor(maxSide / 2);
    x0 = Math.max(0, cx - half);
    x1 = Math.min(n - 1, x0 + maxSide - 1);
    y0 = Math.max(0, cy - half);
    y1 = Math.min(n - 1, y0 + maxSide - 1);
  }

  const out: { x: number; y: number }[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      out.push({ x, y });
    }
  }
  return out;
}

async function warmOne(
  ts: number,
  z: number,
  x: number,
  y: number,
): Promise<void> {
  const key = radarTileCacheKey(String(ts), "", z, x, y);
  if (getCachedRadarTile(key)) return;
  const upstream = `${METEOPOOL_EU_TILE_BASE}/${ts}/${z}/${x}/${y}.webp`;
  const res = await fetch(upstream, {
    headers: {
      Accept: "image/webp",
      "User-Agent": "Thunderstate/1.0",
      Referer: "https://www.meteopool.org/",
    },
    cache: "force-cache",
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return;
  const buf = Buffer.from(await res.arrayBuffer());
  setCachedRadarTile(key, buf);
}

/**
 * Warm MeteoPool EU radar tiles for the given timestamp.
 * Fire-and-forget — never throws to the caller.
 */
export function warmRadarFramesInBackground(
  timestamps: number[],
  zooms: number[] = [4, 5, 6, 7, 8],
): void {
  if (!timestamps.length || !allowBackgroundWarm()) return;
  void Promise.resolve().then(async () => {
    const jobs: { ts: number; z: number; x: number; y: number }[] = [];
    for (const ts of timestamps) {
      for (const z of zooms) {
        const cap = z >= 7 ? 36 : z >= 6 ? 48 : 56;
        for (const { x, y } of tileRange(z, UK_BOUNDS, cap)) {
          jobs.push({ ts, z, x, y });
        }
      }
    }
    const CONCURRENCY = 16;
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const slice = jobs.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map((j) => warmOne(j.ts, j.z, j.x, j.y).catch(() => undefined)),
      );
    }
  });
}
