/**
 * Live European weather-station observations for map station-model overlays.
 * Data via Open-Meteo current + short hourly (pressure tendency).
 */

export type PresentWeather =
  | "clear"
  | "rain-light"
  | "rain-mod"
  | "rain-heavy"
  | "rain-shower"
  | "snow-light"
  | "snow-mod"
  | "snow-heavy"
  | "snow-shower"
  | "ice-pellets"
  | "fog"
  | "thunderstorm";

export type PressureTendency =
  | "rising"
  | "falling"
  | "steady"
  | "rising-then-falling"
  | "falling-then-rising"
  | "rising-then-steady"
  | "falling-then-steady";

/** 1 = national backbone, 2 = regional fill, 3 = local detail */
export type StationTier = 1 | 2 | 3;

export type WeatherStation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tier: StationTier;
  /** Air temperature °C */
  temperatureC: number | null;
  /** Dew point °C */
  dewpointC: number | null;
  /** MSL pressure hPa */
  pressureHpa: number | null;
  /** 3-hour pressure change in tenths of hPa (e.g. -11 = −1.1 hPa) */
  pressureChangeTenths: number | null;
  pressureTendency: PressureTendency | null;
  /** Wind from direction, degrees */
  windDirDeg: number | null;
  /** Wind speed km/h */
  windSpeedKmh: number | null;
  /** Total cloud cover 0–100 */
  cloudCoverPct: number | null;
  presentWeather: PresentWeather;
  observedAt: string | null;
};

export type StationsPayload = {
  stations: WeatherStation[];
  updatedAt: string;
  attribution: string;
};

export type StationSite = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tier: StationTier;
};

/**
 * Expanded UK/Europe observation network.
 * Tier controls when a site is eligible; spatial declutter still enforces spacing.
 */
export const STATION_SITES: StationSite[] = [
  { id: "london", name: "London", lat: 51.5074, lon: -0.1278, tier: 1 },
  { id: "edinburgh", name: "Edinburgh", lat: 55.9533, lon: -3.1883, tier: 1 },
  { id: "cardiff", name: "Cardiff", lat: 51.4816, lon: -3.1791, tier: 1 },
  { id: "belfast", name: "Belfast", lat: 54.5973, lon: -5.9301, tier: 1 },
  { id: "dublin", name: "Dublin", lat: 53.3498, lon: -6.2603, tier: 1 },
  { id: "paris", name: "Paris", lat: 48.8566, lon: 2.3522, tier: 1 },
  { id: "amsterdam", name: "Amsterdam", lat: 52.3676, lon: 4.9041, tier: 1 },
  { id: "berlin", name: "Berlin", lat: 52.52, lon: 13.405, tier: 1 },
  { id: "madrid", name: "Madrid", lat: 40.4168, lon: -3.7038, tier: 1 },
  { id: "rome", name: "Rome", lat: 41.9028, lon: 12.4964, tier: 1 },
  { id: "warsaw", name: "Warsaw", lat: 52.2297, lon: 21.0122, tier: 1 },
  { id: "vienna", name: "Vienna", lat: 48.2082, lon: 16.3738, tier: 1 },
  { id: "manchester", name: "Manchester", lat: 53.4808, lon: -2.2426, tier: 2 },
  { id: "bristol", name: "Bristol", lat: 51.4545, lon: -2.5879, tier: 2 },
  { id: "aberdeen", name: "Aberdeen", lat: 57.1497, lon: -2.0943, tier: 2 },
  { id: "lerwick", name: "Lerwick", lat: 60.1545, lon: -1.145, tier: 2 },
  { id: "prague", name: "Prague", lat: 50.0755, lon: 14.4378, tier: 2 },
  { id: "zurich", name: "Zurich", lat: 47.3769, lon: 8.5417, tier: 2 },
  { id: "barcelona", name: "Barcelona", lat: 41.3874, lon: 2.1686, tier: 2 },
  { id: "lisbon", name: "Lisbon", lat: 38.7223, lon: -9.1393, tier: 2 },
  { id: "brussels", name: "Brussels", lat: 50.8503, lon: 4.3517, tier: 2 },
];

/** Station-model pressure: last 3 digits of tenths of hPa (1019.5 → "195"). */
export function formatStationPressure(hpa: number | null): string {
  if (hpa == null || !Number.isFinite(hpa)) return "";
  const tenths = Math.round(hpa * 10);
  return String(tenths % 1000).padStart(3, "0");
}

export function formatStationTemp(c: number | null): string {
  if (c == null || !Number.isFinite(c)) return "";
  return String(Math.round(c));
}

/** Map Open-Meteo WMO weather code → present-weather class for the plot. */
export function weatherCodeToPresent(code: number | null): PresentWeather {
  if (code == null || !Number.isFinite(code)) return "clear";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunderstorm";
  if (code === 56 || code === 57 || code === 66 || code === 67) return "ice-pellets";
  if (code === 71 || code === 85) return "snow-light";
  if (code === 73) return "snow-mod";
  if (code === 75 || code === 77 || code === 86) return "snow-heavy";
  if (code === 80 || code === 81 || code === 82) return "rain-shower";
  if (code === 51 || code === 61) return "rain-light";
  if (code === 53 || code === 63) return "rain-mod";
  if (code === 55 || code === 65) return "rain-heavy";
  return "clear";
}

function tendencyFromSeries(
  nowHpa: number | null,
  series: (number | null)[],
): { changeTenths: number | null; tendency: PressureTendency | null } {
  if (nowHpa == null || !Number.isFinite(nowHpa)) {
    return { changeTenths: null, tendency: null };
  }
  const past = [...series].reverse().find((v) => v != null && Number.isFinite(v));
  if (past == null) return { changeTenths: null, tendency: "steady" };
  const delta = nowHpa - past;
  const changeTenths = Math.round(delta * 10);
  if (Math.abs(delta) < 0.15) return { changeTenths, tendency: "steady" };
  if (delta > 0) return { changeTenths, tendency: "rising" };
  return { changeTenths, tendency: "falling" };
}

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  dewpoint_2m?: number;
  weather_code?: number;
  cloud_cover?: number;
  pressure_msl?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
};

type OpenMeteoRow = {
  latitude?: number;
  longitude?: number;
  current?: OpenMeteoCurrent;
  hourly?: {
    time?: string[];
    pressure_msl?: (number | null)[];
  };
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function parseRow(site: StationSite, row: OpenMeteoRow): WeatherStation {
  const cur = row.current ?? {};
  const hourlyP = row.hourly?.pressure_msl ?? [];
  const pastWindow = hourlyP.slice(0, Math.max(0, hourlyP.length - 1));
  const { changeTenths, tendency } = tendencyFromSeries(
    num(cur.pressure_msl),
    pastWindow,
  );
  return {
    id: site.id,
    name: site.name,
    lat: site.lat,
    lon: site.lon,
    tier: site.tier,
    temperatureC: num(cur.temperature_2m),
    dewpointC: num(cur.dewpoint_2m),
    pressureHpa: num(cur.pressure_msl),
    pressureChangeTenths: changeTenths,
    pressureTendency: tendency,
    windDirDeg: num(cur.wind_direction_10m),
    windSpeedKmh: num(cur.wind_speed_10m),
    cloudCoverPct: num(cur.cloud_cover),
    presentWeather: weatherCodeToPresent(num(cur.weather_code)),
    observedAt: typeof cur.time === "string" ? cur.time : null,
  };
}

/** Rough km separation used for declutter (lat-scaled). */
function separationKm(a: WeatherStation, b: WeatherStation): number {
  const dLat = (a.lat - b.lat) * 111;
  const midLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dLon = (a.lon - b.lon) * 111 * Math.cos(midLat);
  return Math.hypot(dLat, dLon);
}

export type StationDensity = {
  /** Max stations to draw in the current view. */
  maxCount: number;
  /** Minimum km between plotted stations. */
  minSeparationKm: number;
  /** Highest tier eligible (1–3). */
  maxTier: StationTier;
  /** Render scale for the station-model glyph (1 = full). */
  scale: number;
};

/** Leaflet zoom → density. Tuned so national view stays readable. */
export function densityForLeafletZoom(zoom: number): StationDensity {
  if (zoom < 4) {
    return { maxCount: 0, minSeparationKm: 999, maxTier: 1, scale: 0.85 };
  }
  if (zoom < 4.7) {
    // Full Europe — capitals + sparse hubs only
    return { maxCount: 14, minSeparationKm: 400, maxTier: 1, scale: 0.8 };
  }
  if (zoom < 5.4) {
    return { maxCount: 20, minSeparationKm: 280, maxTier: 2, scale: 0.88 };
  }
  if (zoom < 6.2) {
    return { maxCount: 30, minSeparationKm: 160, maxTier: 2, scale: 0.94 };
  }
  if (zoom < 7) {
    return { maxCount: 42, minSeparationKm: 90, maxTier: 3, scale: 1 };
  }
  if (zoom < 8) {
    return { maxCount: 58, minSeparationKm: 50, maxTier: 3, scale: 1 };
  }
  return { maxCount: 72, minSeparationKm: 28, maxTier: 3, scale: 1 };
}

/**
 * Fixed satellite/region crop → density from geographic span.
 * National (~60° lon) is sparse; state crops denser.
 */
export function densityForBounds(bounds: [[number, number], [number, number]]): StationDensity {
  const [[south, west], [north, east]] = bounds;
  const spanLon = Math.abs(east - west);
  const spanLat = Math.abs(north - south);
  const span = Math.max(spanLon, spanLat);
  if (span >= 40) {
    // Full continent — capitals + hubs only
    return { maxCount: 14, minSeparationKm: 400, maxTier: 1, scale: 0.78 };
  }
  if (span >= 20) {
    // Large state crops (WLS / EU) — regional fill, still airy
    return { maxCount: 18, minSeparationKm: 220, maxTier: 2, scale: 0.88 };
  }
  if (span >= 10) {
    // Typical state crop (ENG / IRE / NLD) — include local towns
    return { maxCount: 26, minSeparationKm: 95, maxTier: 3, scale: 0.94 };
  }
  if (span >= 5) {
    return { maxCount: 36, minSeparationKm: 55, maxTier: 3, scale: 1 };
  }
  return { maxCount: 50, minSeparationKm: 28, maxTier: 3, scale: 1 };
}

/**
 * Greedy declutter: keep the tier-1 backbone (soft spacing so capitals stay),
 * then fill with regional/local sites under full separation.
 */
export function declutterStations(
  stations: WeatherStation[],
  density: StationDensity,
): WeatherStation[] {
  if (density.maxCount <= 0) return [];
  const byName = (a: WeatherStation, b: WeatherStation) =>
    a.name.localeCompare(b.name);

  const eligible = stations.filter((s) => s.tier <= density.maxTier);
  const backbone = eligible.filter((s) => s.tier === 1).sort(byName);
  const fill = eligible.filter((s) => s.tier > 1).sort((a, b) => a.tier - b.tier || byName(a, b));

  const picked: WeatherStation[] = [];
  // Soft spacing among capitals so London / Edinburgh / Amsterdam can coexist
  const backboneSepKm = Math.max(180, density.minSeparationKm * 0.5);
  for (const s of backbone) {
    if (picked.length >= density.maxCount) break;
    if (picked.every((p) => separationKm(p, s) >= backboneSepKm)) {
      picked.push(s);
    }
  }
  for (const s of fill) {
    if (picked.length >= density.maxCount) break;
    if (picked.every((p) => separationKm(p, s) >= density.minSeparationKm)) {
      picked.push(s);
    }
  }
  return picked;
}

export async function fetchLiveStations(
  signal?: AbortSignal,
): Promise<StationsPayload> {
  // Open-Meteo caps URL length; batch in chunks of 40.
  const chunkSize = 40;
  const stations: WeatherStation[] = [];

  for (let start = 0; start < STATION_SITES.length; start += chunkSize) {
    const chunk = STATION_SITES.slice(start, start + chunkSize);
    const lats = chunk.map((s) => s.lat.toFixed(4)).join(",");
    const lons = chunk.map((s) => s.lon.toFixed(4)).join(",");
    const params = new URLSearchParams({
      latitude: lats,
      longitude: lons,
      current: [
        "temperature_2m",
        "dewpoint_2m",
        "weather_code",
        "cloud_cover",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
      ].join(","),
      hourly: "pressure_msl",
      past_hours: "3",
      forecast_hours: "1",
      wind_speed_unit: "kmh",
      timezone: "Europe/London",
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const res = await fetch(url, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Open-Meteo stations unavailable (${res.status})`);
    }
    const json = (await res.json()) as OpenMeteoRow | OpenMeteoRow[];
    const rows = Array.isArray(json) ? json : [json];
    for (let i = 0; i < chunk.length; i++) {
      stations.push(parseRow(chunk[i]!, rows[i] ?? {}));
    }
  }

  return {
    stations,
    updatedAt: new Date().toISOString(),
    attribution: "Open-Meteo",
  };
}

let cache: { at: number; payload: StationsPayload } | null = null;
const CACHE_MS = 2 * 60_000;

export async function getLiveStationsCached(
  signal?: AbortSignal,
): Promise<StationsPayload> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.payload;
  const payload = await fetchLiveStations(signal);
  cache = { at: Date.now(), payload };
  return payload;
}
