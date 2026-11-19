import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_SATELLITE_PRODUCT,
  GIBS_AU_BOUNDS,
  HIMAEURI_STEP_SEC,
  SATELLITE_FRAME_COUNT,
  SATELLITE_PRODUCTS,
  buildContiguousTimeline,
  gibsHimawariWmsUrl,
  getSatelliteProduct,
  isSatelliteProductId,
  meteoPoolTileUrlTemplate,
  parseRealEarthTimeToken,
  parseSatelliteFrameCountParam,
  satelliteFrameProxyUrl,
  toIsoZ,
  type SatelliteProductId,
  type SatelliteFrameCount,
  type SatelliteProductMeta,
  type WeatherFrame,
  type WeatherMapsPayload,
} from "@/lib/weather/maps";
import { isRealEarthDisabled, warmFramesInBackground } from "@/lib/weather/fetch-frame";
import {
  allowBackgroundWarm,
  isHobbyBudget,
} from "@/lib/runtime-budget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const METEOPOOL_EU_TS_URL =
  "https://www.meteopool.org/helper/radar-last-modified-v2-tiles-eu.php";
const GIBS_STEP_MS = HIMAEURI_STEP_SEC * 1000;
const GIBS_PROBE_MAX = isHobbyBudget() ? 8 : 18;
const GIBS_PROBE_BATCH = isHobbyBudget() ? 2 : 4;
const GIBS_PROBE_WIDTH = 96;
const FRAME_COUNT: SatelliteFrameCount = SATELLITE_FRAME_COUNT;

function emptyProductFrames(): WeatherMapsPayload["satellite"]["products"] {
  return Object.fromEntries(
    SATELLITE_PRODUCTS.map((p) => [p.id, { frames: [] as WeatherFrame[] }]),
  ) as WeatherMapsPayload["satellite"]["products"];
}

/** Fast content probe using a tiny WMS render instead of the full frame. */
async function probeGibsWms(
  isoTime: string,
  product: SatelliteProductId,
): Promise<boolean> {
  try {
    const res = await fetch(
      gibsHimawariWmsUrl(isoTime, product, { width: GIBS_PROBE_WIDTH }),
      {
        method: "GET",
        headers: { "User-Agent": "Thunderstate/1.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("image")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    // Tiny empty GIBS stubs are often ~1–3KB even at probe width; real crops are denser.
    if (buf.length < 4_000) return false;
    let nonBlack = 0;
    for (let i = 40; i < Math.min(buf.length, 2500); i += 11) {
      if (buf[i]! > 16) nonBlack += 1;
    }
    return nonBlack >= 10;
  } catch {
    return false;
  }
}

/** When NAIRE probing fails (timeouts / egress blips), still offer a loop. */
function fallbackLatestMs(): number {
  // RealEarth tip is typically ~15–30 min behind wall clock.
  const lagMs = 20 * 60 * 1000;
  return Math.floor((Date.now() - lagMs) / GIBS_STEP_MS) * GIBS_STEP_MS;
}

async function findLatestGibsTime(
  product: SatelliteProductId,
): Promise<number | null> {
  const latestMs = Math.floor(Date.now() / GIBS_STEP_MS) * GIBS_STEP_MS;
  const candidates: number[] = [];
  // Probe from the current slot — unpublished tips fail the content gate.
  for (let i = 0; i < GIBS_PROBE_MAX; i++) {
    candidates.push(latestMs - i * GIBS_STEP_MS);
  }

  for (let start = 0; start < candidates.length; start += GIBS_PROBE_BATCH) {
    const batch = candidates.slice(start, start + GIBS_PROBE_BATCH);
    const results = await Promise.all(
      batch.map(async (ms) =>
        (await probeGibsWms(toIsoZ(ms), product)) ? ms : null,
      ),
    );
    const hit = results.find((ms) => ms != null);
    if (hit != null) return hit;
  }
  return null;
}

async function fetchRealEarthTimes(
  realearthProduct: string,
  count: SatelliteFrameCount = FRAME_COUNT,
): Promise<number[]> {
  try {
    const res = await fetch(
      `https://realearth.ssec.wisc.edu/api/products?products=${encodeURIComponent(realearthProduct)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Thunderstate/1.0",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ times?: string[] }>;
    const tokens = data[0]?.times ?? [];
    const parsed = tokens
      .map(parseRealEarthTimeToken)
      .filter((t) => Number.isFinite(t) && t > 0) as number[];
    if (parsed.length === 0) return [];
    return parsed.slice(-count);
  } catch {
    return [];
  }
}

function buildFramesFromTimes(
  product: SatelliteProductId,
  timesUnix: number[],
): WeatherFrame[] {
  return timesUnix.map((time) => ({
    time,
    imageUrl: satelliteFrameProxyUrl(product, time),
    imageBounds: GIBS_AU_BOUNDS,
  }));
}

function buildFramesAtLatest(
  product: SatelliteProductId,
  latestMs: number,
  count: SatelliteFrameCount = FRAME_COUNT,
): WeatherFrame[] {
  return buildFramesFromTimes(
    product,
    buildContiguousTimeline(Math.floor(latestMs / 1000), count),
  );
}

async function buildProductFrames(
  meta: SatelliteProductMeta,
  sharedTimelineUnix: number[] | null,
  fallbackLatestMs: number | null,
  frameCount: SatelliteFrameCount = FRAME_COUNT,
): Promise<WeatherFrame[]> {
  if (sharedTimelineUnix && sharedTimelineUnix.length >= 3) {
    return buildFramesFromTimes(meta.id, sharedTimelineUnix);
  }

  if (!isRealEarthDisabled() && meta.realearthProduct) {
    const native = await fetchRealEarthTimes(meta.realearthProduct, frameCount);
    if (native.length >= 3) {
      const tip = native[native.length - 1]!;
      return buildFramesFromTimes(
        meta.id,
        buildContiguousTimeline(tip, frameCount),
      );
    }
  }

  if (fallbackLatestMs != null) {
    return buildFramesAtLatest(meta.id, fallbackLatestMs, frameCount);
  }
  return [];
}

/**
 * Shared RealEarth-led Himawari spine (contiguous 10-minute stamps).
 * GIBS is only a tip/fallback — never thin the loop to RainViewer radar.
 */
async function buildAllSatelliteProducts(frameCount: SatelliteFrameCount): Promise<{
  products: WeatherMapsPayload["satellite"]["products"];
  source: WeatherMapsPayload["satellite"]["source"];
}> {
  const products = emptyProductFrames();

  const infraredMeta = getSatelliteProduct("infrared");
  const infraredTimes =
    !isRealEarthDisabled() && infraredMeta.realearthProduct != null
      ? await fetchRealEarthTimes(infraredMeta.realearthProduct, frameCount)
      : [];

  const gibsLatestMs =
    infraredTimes.length >= 3
      ? null
      : ((await findLatestGibsTime("infrared")) ??
        (await findLatestGibsTime("airmass")) ??
        (await findLatestGibsTime("visible")) ??
        fallbackLatestMs());

  const tipUnix =
    infraredTimes.length >= 3
      ? infraredTimes[infraredTimes.length - 1]!
      : Math.floor((gibsLatestMs ?? fallbackLatestMs()) / 1000);

  const sharedTimeline = buildContiguousTimeline(tipUnix, frameCount);

  const built = await Promise.all(
    SATELLITE_PRODUCTS.map(async (meta) => {
      const frames = await buildProductFrames(
        meta,
        sharedTimeline,
        gibsLatestMs ?? tipUnix * 1000,
        frameCount,
      );
      return [meta.id, frames] as const;
    }),
  );

  for (const [id, frames] of built) {
    products[id] = { frames };
  }

  // Warm only the newest few IR frames — full-loop warm burned Fluid CPU.
  if (allowBackgroundWarm() && products.infrared.frames.length) {
    const tipTimes = products.infrared.frames
      .map((f) => f.time)
      .slice(-3);
    warmFramesInBackground("infrared", tipTimes, 1);
  }

  return {
    products,
    source: infraredTimes.length >= 3 ? "realearth-himawari" : "gibs-himawari",
  };
}

export async function GET(request: NextRequest) {
  try {
    const frameCount = parseSatelliteFrameCountParam(
      request.nextUrl.searchParams.get("frameCount"),
    );
    if (frameCount == null) {
      return NextResponse.json(
        { error: "Unsupported satellite frame count" },
        { status: 400 },
      );
    }
    const rawProduct = request.nextUrl.searchParams.get("product") ?? "";
    const wantAll =
      rawProduct === "all" ||
      rawProduct === "" ||
      request.nextUrl.searchParams.get("all") === "1";
    const product: SatelliteProductId = isSatelliteProductId(rawProduct)
      ? rawProduct
      : DEFAULT_SATELLITE_PRODUCT;

    const mpTsPromise = fetch(METEOPOOL_EU_TS_URL, {
      headers: {
        Accept: "text/plain",
        "User-Agent": "Thunderstate/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
      .then(async (mpRes) => {
        if (!mpRes.ok) throw new Error(`MeteoPool HTTP ${mpRes.status}`);
        const text = await mpRes.text();
        const ts = Number.parseInt(text.trim(), 10);
        if (!Number.isFinite(ts) || ts <= 0) throw new Error("Invalid MeteoPool timestamp");
        return ts;
      })
      .catch(() => null);

    const mpTs = await mpTsPromise;
    const radarAll: WeatherFrame[] = mpTs != null
      ? [{
          time: mpTs,
          tileUrlTemplate: meteoPoolTileUrlTemplate(mpTs),
        }]
      : [];

    const satellite = wantAll
      ? await buildAllSatelliteProducts(frameCount)
      : await (async () => {
          const products = emptyProductFrames();
          const meta = getSatelliteProduct(product);
          const native = !isRealEarthDisabled() && meta.realearthProduct
            ? await fetchRealEarthTimes(meta.realearthProduct, frameCount)
            : [];
          const gibsLatestMs =
            native.length >= 3
              ? null
              : ((await findLatestGibsTime(
                  meta.id === "visible" ? "infrared" : meta.id,
                )) ?? fallbackLatestMs());
          const tipUnix =
            native.length >= 3
              ? native[native.length - 1]!
              : Math.floor((gibsLatestMs ?? fallbackLatestMs()) / 1000);
          products[product] = {
            frames: await buildProductFrames(
              meta,
              buildContiguousTimeline(tipUnix, frameCount),
              gibsLatestMs ?? tipUnix * 1000,
              frameCount,
            ),
          };
          return {
            products,
            source:
              native.length >= 3
                ? ("realearth-himawari" as const)
                : ("gibs-himawari" as const),
          };
        })();

    const generated = mpTs ?? Math.floor(Date.now() / 1000);
    const activeProduct = wantAll ? DEFAULT_SATELLITE_PRODUCT : product;
    const frames = satellite.products[activeProduct].frames;
    const activeMeta = getSatelliteProduct(activeProduct);

    // Hobby: never warm radar tiles server-side. MeteoPool tiles are already
    // coloured WebP — no recolour CPU burn.
    const host = "https://www.meteopool.org";

    const payload: WeatherMapsPayload = {
      generated,
      host,
      satellite: {
        product: activeProduct,
        source: satellite.source,
        frames,
        products: satellite.products,
      },
      radar: {
        past: radarAll,
        source: "meteopool",
      },
    };

    const mapsCache = isHobbyBudget()
      ? "public, s-maxage=120, stale-while-revalidate=300"
      : "public, s-maxage=60, stale-while-revalidate=120";

    return NextResponse.json(payload, {
      headers: {
        // Tip advances every ~10 min — longer CDN on Hobby cuts origin hits.
        "Cache-Control": mapsCache,
        "X-Satellite-Product": wantAll ? "all" : product,
        "X-Satellite-Layer":
          activeMeta.realearthProduct ?? activeMeta.gibsLayer ?? activeProduct,
        "X-Satellite-Source": satellite.source,
        "X-Satellite-Latest": frames.length
          ? String(frames[frames.length - 1]!.time)
          : "",
        "X-Satellite-Frame-Count": String(frames.length),
      },
    });
  } catch (error) {
    console.error("[weather/maps]", error);
    return NextResponse.json(
      { error: "Failed to load weather maps" },
      { status: 502 },
    );
  }
}
