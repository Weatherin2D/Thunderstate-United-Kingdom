/** UK/Europe location search and Open-Meteo forecasts. */

const FETCH_UA =
  "Mozilla/5.0 (Windows NLD 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type BomLocation = {
  geohash: string;
  id: string;
  name: string;
  state: string;
  postcode: string | null;
  /** 6-char geohash used for hourly + observations. */
  gridGeohash: string;
};

export type BomLocationMeta = BomLocation & {
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type BomRainAmount = {
  min: number | null;
  max: number | null;
  units: string;
};

export type BomDailyForecast = {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  shortText: string;
  extendedText: string;
  icon: string;
  rainUnits: string;
  rainChance: number | null;
  rainChanceOfNoRainCategory: string | null;
  rainMinMm: number | null;
  rainMaxMm: number | null;
  rainAmount25PercentChanceMm: number | null;
  rainAmount50PercentChanceMm: number | null;
  rainAmount75PercentChanceMm: number | null;
  uvCategory: string | null;
  uvMaxIndex: number | null;
  uvStartTime: string | null;
  uvEndTime: string | null;
  sunrise: string | null;
  sunset: string | null;
  fireDanger: string | null;
  fireDangerColour: string | null;
  fireDangerDarkModeColour: string | null;
  surfDanger: string | null;
  surfDangerColour: string | null;
  surfDangerDarkModeColour: string | null;
  nowLabel: string | null;
  laterLabel: string | null;
  tempNow: number | null;
  tempLater: number | null;
  isNight: boolean;
};

export type BomHourlyForecast = {
  time: string;
  temp: number | null;
  tempFeelsLike: number | null;
  dewPoint: number | null;
  icon: string;
  isNight: boolean;
  rainUnits: string;
  rainChance: number | null;
  rainMinMm: number | null;
  rainMaxMm: number | null;
  rainAmount10PercentChanceMm: number | null;
  rainAmount25PercentChanceMm: number | null;
  rainAmount50PercentChanceMm: number | null;
  windKmh: number | null;
  windKnots: number | null;
  windDir: string | null;
  gustKmh: number | null;
  gustKnots: number | null;
  humidity: number | null;
  uv: number | null;
  nextForecastPeriod: string | null;
  nextThreeHourlyForecastPeriod: string | null;
};

export type BomObservation = {
  temp: number | null;
  tempFeelsLike: number | null;
  humidity: number | null;
  windKmh: number | null;
  windKnots: number | null;
  windDir: string | null;
  gustKmh: number | null;
  gustTime: string | null;
  maxGustKmh: number | null;
  maxGustTime: string | null;
  maxTemp: number | null;
  maxTempTime: string | null;
  minTemp: number | null;
  minTempTime: string | null;
  rainSince9am: number | null;
  stationName: string | null;
  stationId: string | null;
  stationDistanceKm: number | null;
  observationTime: string | null;
};

export type LocationForecastPayload = {
  location: BomLocationMeta;
  observation: BomObservation | null;
  daily: BomDailyForecast[];
  hourly: BomHourlyForecast[];
  issueTime: string | null;
  hourlyIssueTime: string | null;
  nextIssueTime: string | null;
  attribution: string;
};

/** State header links → capital city search seed. */
export const STATE_CAPITALS: Record<
  string,
  { name: string; geohash: string; state: string }
> = {
  nsw: { name: "London", geohash: "uk-london", state: "England" },
  vic: { name: "Edinburgh", geohash: "uk-edinburgh", state: "Scotland" },
  qld: { name: "Cardiff", geohash: "uk-cardiff", state: "Wales" },
  wa: { name: "Belfast", geohash: "uk-belfast", state: "Northern Ireland" },
  sa: { name: "Dublin", geohash: "ie-dublin", state: "Ireland" },
  tas: { name: "Paris", geohash: "fr-paris", state: "France" },
  nt: { name: "Amsterdam", geohash: "nl-amsterdam", state: "Netherlands" },
  act: { name: "Berlin", geohash: "de-berlin", state: "Germany" },
  europe: { name: "London", geohash: "uk-london", state: "England" },
  eng: { name: "London", geohash: "uk-london", state: "England" },
  sct: { name: "Edinburgh", geohash: "uk-edinburgh", state: "Scotland" },
  wls: { name: "Cardiff", geohash: "uk-cardiff", state: "Wales" },
  nir: { name: "Belfast", geohash: "uk-belfast", state: "Northern Ireland" },
  ire: { name: "Dublin", geohash: "ie-dublin", state: "Ireland" },
  eur: { name: "Paris", geohash: "fr-paris", state: "France" },
};

/** Ordered capital cities for the national home strip. */
export const CAPITAL_CITIES = [
  STATE_CAPITALS.nsw,
  STATE_CAPITALS.vic,
  STATE_CAPITALS.qld,
  STATE_CAPITALS.wa,
  STATE_CAPITALS.sa,
  STATE_CAPITALS.tas,
  STATE_CAPITALS.act,
  STATE_CAPITALS.nt,
] as const;

const EUROPE_LOCATIONS = [
  { geohash: "uk-london", name: "London", state: "England", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
  { geohash: "uk-edinburgh", name: "Edinburgh", state: "Scotland", lat: 55.9533, lon: -3.1883, timezone: "Europe/London" },
  { geohash: "uk-cardiff", name: "Cardiff", state: "Wales", lat: 51.4816, lon: -3.1791, timezone: "Europe/London" },
  { geohash: "uk-belfast", name: "Belfast", state: "Northern Ireland", lat: 54.5973, lon: -5.9301, timezone: "Europe/London" },
  { geohash: "ie-dublin", name: "Dublin", state: "Ireland", lat: 53.3498, lon: -6.2603, timezone: "Europe/Dublin" },
  { geohash: "fr-paris", name: "Paris", state: "France", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
  { geohash: "nl-amsterdam", name: "Amsterdam", state: "Netherlands", lat: 52.3676, lon: 4.9041, timezone: "Europe/Amsterdam" },
  { geohash: "de-berlin", name: "Berlin", state: "Germany", lat: 52.52, lon: 13.405, timezone: "Europe/Berlin" },
  { geohash: "es-madrid", name: "Madrid", state: "Spain", lat: 40.4168, lon: -3.7038, timezone: "Europe/Madrid" },
  { geohash: "it-rome", name: "Rome", state: "Italy", lat: 41.9028, lon: 12.4964, timezone: "Europe/Rome" },
  { geohash: "pl-warsaw", name: "Warsaw", state: "Poland", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" },
  { geohash: "at-vienna", name: "Vienna", state: "Austria", lat: 48.2082, lon: 16.3738, timezone: "Europe/Vienna" },
] as const;

export type CapitalSnapshot = {
  city: string;
  state: string;
  geohash: string;
  href: string;
  tempC: number | null;
  wind: string | null;
  condition: string | null;
  icon: string | null;
};

export type LocationSnapshot = {
  location: BomLocationMeta;
  observation: BomObservation | null;
  today: BomDailyForecast | null;
  daily: BomDailyForecast[];
  issueTime: string | null;
};

async function bomGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": FETCH_UA,
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Met Office request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function gridGeohash(geohash: string): string {
  const g = geohash.trim().toLowerCase();
  return g.length >= 6 ? g.slice(0, 6) : g;
}

export function isValidGeohash(geohash: string): boolean {
  const value = geohash.trim().toLowerCase();
  return /^[0-9b-hjkmnp-z]{5,12}$/i.test(value) ||
    /^(uk|ie|fr|nl|de|es|it|pl|at|cz)-[a-z-]+$/i.test(value);
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function weatherText(code: number | null): string {
  if (code == null) return "Unknown";
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function dangerDetails(
  value: unknown,
  fallback?: unknown,
): { text: string | null; colour: string | null; darkModeColour: string | null } {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    text:
      str(row.text) ||
      str(row.label) ||
      str(row.category) ||
      str(value) ||
      str(fallback),
    colour: str(row.default_colour),
    darkModeColour: str(row.dark_mode_colour),
  };
}

export async function searchBomLocations(
  query: string,
  limit = 8,
): Promise<BomLocation[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return EUROPE_LOCATIONS
    .filter((location) =>
      `${location.name} ${location.state}`.toLowerCase().includes(q),
    )
    .slice(0, limit)
    .map((location) => ({
      geohash: location.geohash,
      gridGeohash: location.geohash,
      id: location.geohash,
      name: location.name,
      state: location.state,
      postcode: null,
    }));
}

export async function fetchBomLocationMeta(
  geohash: string,
): Promise<BomLocationMeta | null> {
  if (!isValidGeohash(geohash)) return null;
  const gh = geohash.trim().toLowerCase();
  const location =
    EUROPE_LOCATIONS.find((candidate) => candidate.geohash === gh) ??
    EUROPE_LOCATIONS[0]!;
  return {
    geohash: location.geohash,
    gridGeohash: location.geohash,
    id: location.geohash,
    name: location.name,
    state: location.state,
    postcode: null,
    timezone: location.timezone,
    latitude: location.lat,
    longitude: location.lon,
  };
}

function mapDaily(row: Record<string, unknown>): BomDailyForecast {
  const rain = (row.rain as Record<string, unknown> | undefined) || {};
  const amount = (rain.amount as Record<string, unknown> | undefined) || {};
  const uv = (row.uv as Record<string, unknown> | undefined) || {};
  const astro =
    (row.astronomical as Record<string, unknown> | undefined) || {};
  const fire =
    (row.fire_danger_category as Record<string, unknown> | undefined) || {};
  const fireDanger = dangerDetails(fire, row.fire_danger);
  const surfDanger = dangerDetails(row.surf_danger);
  const now = (row.now as Record<string, unknown> | undefined) || {};

  return {
    date: String(row.date || ""),
    tempMax: num(row.temp_max),
    tempMin: num(row.temp_min),
    shortText: str(row.short_text) || "",
    extendedText: str(row.extended_text) || "",
    icon: str(row.icon_descriptor) || "mostly_sunny",
    rainUnits: str(amount.units) || str(rain.units) || "mm",
    rainChance: num(rain.chance),
    rainChanceOfNoRainCategory: str(rain.chance_of_no_rain_category),
    rainMinMm: num(amount.min) ?? num(amount.lower_range),
    rainMaxMm: num(amount.max) ?? num(amount.upper_range),
    rainAmount25PercentChanceMm: num(
      rain.precipitation_amount_25_percent_chance,
    ),
    rainAmount50PercentChanceMm: num(
      rain.precipitation_amount_50_percent_chance,
    ),
    rainAmount75PercentChanceMm: num(
      rain.precipitation_amount_75_percent_chance,
    ),
    uvCategory: str(uv.category),
    uvMaxIndex: num(uv.max_index),
    uvStartTime: str(uv.start_time),
    uvEndTime: str(uv.end_time),
    sunrise: str(astro.sunrise_time),
    sunset: str(astro.sunset_time),
    fireDanger: fireDanger.text,
    fireDangerColour: fireDanger.colour,
    fireDangerDarkModeColour: fireDanger.darkModeColour,
    surfDanger: surfDanger.text,
    surfDangerColour: surfDanger.colour,
    surfDangerDarkModeColour: surfDanger.darkModeColour,
    nowLabel: str(now.now_label),
    laterLabel: str(now.later_label),
    tempNow: num(now.temp_now),
    tempLater: num(now.temp_later),
    isNight: Boolean(now.is_night),
  };
}

function mapHourly(row: Record<string, unknown>): BomHourlyForecast {
  const rain = (row.rain as Record<string, unknown> | undefined) || {};
  const amount = (rain.amount as Record<string, unknown> | undefined) || {};
  const wind = (row.wind as Record<string, unknown> | undefined) || {};
  return {
    time: String(row.time || ""),
    temp: num(row.temp),
    tempFeelsLike: num(row.temp_feels_like),
    dewPoint: num(row.dew_point),
    icon: str(row.icon_descriptor) || "mostly_sunny",
    isNight: Boolean(row.is_night),
    rainUnits: str(amount.units) || str(rain.units) || "mm",
    rainChance: num(rain.chance),
    rainMinMm: num(amount.min),
    rainMaxMm: num(amount.max),
    rainAmount10PercentChanceMm: num(
      rain.precipitation_amount_10_percent_chance,
    ),
    rainAmount25PercentChanceMm: num(
      rain.precipitation_amount_25_percent_chance,
    ),
    rainAmount50PercentChanceMm: num(
      rain.precipitation_amount_50_percent_chance,
    ),
    windKmh: num(wind.speed_kilometre),
    windKnots: num(wind.speed_knot),
    windDir: str(wind.direction),
    gustKmh: num(wind.gust_speed_kilometre),
    gustKnots: num(wind.gust_speed_knot),
    humidity: num(row.relative_humidity),
    uv: num(row.uv),
    nextForecastPeriod: str(row.next_forecast_period),
    nextThreeHourlyForecastPeriod: str(row.next_three_hourly_forecast_period),
  };
}

function measure(
  value: unknown,
): { value: number | null; time: string | null } {
  if (typeof value === "number") return { value: num(value), time: null };
  if (!value || typeof value !== "object") {
    return { value: null, time: null };
  }
  const row = value as Record<string, unknown>;
  return {
    value: num(row.value) ?? num(row.speed_kilometre),
    time: str(row.time),
  };
}

function mapObservation(
  data: Record<string, unknown> | null | undefined,
  observationTime: string | null,
): BomObservation | null {
  if (!data) return null;
  const wind = (data.wind as Record<string, unknown> | undefined) || {};
  const station = (data.station as Record<string, unknown> | undefined) || {};
  const gust = measure(data.gust);
  const maxGust = measure(data.max_gust);
  const maxTemp = measure(data.max_temp);
  const minTemp = measure(data.min_temp);
  const stationDistance = num(station.distance);
  return {
    temp: num(data.temp),
    tempFeelsLike: num(data.temp_feels_like),
    humidity: num(data.humidity),
    windKmh: num(wind.speed_kilometre),
    windKnots: num(wind.speed_knot),
    windDir: str(wind.direction),
    gustKmh: gust.value,
    gustTime: gust.time,
    maxGustKmh: maxGust.value,
    maxGustTime: maxGust.time,
    maxTemp: maxTemp.value,
    maxTempTime: maxTemp.time,
    minTemp: minTemp.value,
    minTempTime: minTemp.time,
    rainSince9am: num(data.rain_since_9am),
    stationName: str(station.name),
    stationId: str(station.bom_id),
    stationDistanceKm:
      stationDistance != null ? stationDistance / 1000 : null,
    observationTime,
  };
}

export async function fetchLocationForecast(
  geohash: string,
): Promise<LocationForecastPayload | null> {
  if (!isValidGeohash(geohash)) return null;
  const location = await fetchBomLocationMeta(geohash);
  if (!location) return null;
  if (location.latitude == null || location.longitude == null) return null;

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure",
    hourly: "temperature_2m,apparent_temperature,dew_point_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset,uv_index_max",
    forecast_days: "7",
    timezone: "auto",
    wind_speed_unit: "kmh",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Open-Meteo unavailable (${res.status})`);
  const payload = await res.json() as {
    current?: Record<string, number | string | null>;
    current_units?: Record<string, string>;
    hourly?: Record<string, Array<number | string | null>>;
    daily?: Record<string, Array<number | string | null>>;
  };

  const dates = (payload.daily?.time as string[] | undefined) ?? [];
  const daily: BomDailyForecast[] = dates.map((date, i) => ({
    date,
    tempMax: num(payload.daily?.temperature_2m_max?.[i]),
    tempMin: num(payload.daily?.temperature_2m_min?.[i]),
    shortText: weatherText(num(payload.daily?.weather_code?.[i])),
    extendedText: weatherText(num(payload.daily?.weather_code?.[i])),
    icon: String(num(payload.daily?.weather_code?.[i]) ?? ""),
    rainUnits: "mm",
    rainChance: num(payload.daily?.precipitation_probability_max?.[i]),
    rainChanceOfNoRainCategory: null,
    rainMinMm: null,
    rainMaxMm: null,
    rainAmount25PercentChanceMm: null,
    rainAmount50PercentChanceMm: null,
    rainAmount75PercentChanceMm: null,
    uvCategory: null,
    uvMaxIndex: num(payload.daily?.uv_index_max?.[i]),
    uvStartTime: null,
    uvEndTime: null,
    sunrise: str(payload.daily?.sunrise?.[i]),
    sunset: str(payload.daily?.sunset?.[i]),
    fireDanger: null,
    fireDangerColour: null,
    fireDangerDarkModeColour: null,
    surfDanger: null,
    surfDangerColour: null,
    surfDangerDarkModeColour: null,
    nowLabel: null,
    laterLabel: null,
    tempNow: num(payload.current?.temperature_2m),
    tempLater: null,
    isNight: false,
  }));

  const hourlyTimes = (payload.hourly?.time as string[] | undefined) ?? [];
  const hourly: BomHourlyForecast[] = hourlyTimes.slice(0, 48).map((time, i) => ({
    time,
    temp: num(payload.hourly?.temperature_2m?.[i]),
    tempFeelsLike: num(payload.hourly?.apparent_temperature?.[i]),
    dewPoint: num(payload.hourly?.dew_point_2m?.[i]),
    icon: String(num(payload.hourly?.weather_code?.[i]) ?? ""),
    isNight: false,
    rainUnits: "mm",
    rainChance: num(payload.hourly?.precipitation_probability?.[i]),
    rainMinMm: null,
    rainMaxMm: null,
    rainAmount10PercentChanceMm: null,
    rainAmount25PercentChanceMm: null,
    rainAmount50PercentChanceMm: null,
    windKmh: num(payload.hourly?.wind_speed_10m?.[i]),
    windKnots: null,
    windDir: null,
    gustKmh: null,
    gustKnots: null,
    humidity: num(payload.hourly?.relative_humidity_2m?.[i]),
    uv: null,
    nextForecastPeriod: null,
    nextThreeHourlyForecastPeriod: null,
  }));

  const observation: BomObservation = {
    temp: num(payload.current?.temperature_2m),
    tempFeelsLike: num(payload.current?.apparent_temperature),
    humidity: num(payload.current?.relative_humidity_2m),
    windKmh: num(payload.current?.wind_speed_10m),
    windKnots: null,
    windDir: null,
    gustKmh: null,
    gustTime: null,
    maxGustKmh: null,
    maxGustTime: null,
    maxTemp: daily[0]?.tempMax ?? null,
    maxTempTime: null,
    minTemp: daily[0]?.tempMin ?? null,
    minTempTime: null,
    rainSince9am: num(payload.current?.precipitation),
    stationName: location.name,
    stationId: location.id,
    stationDistanceKm: 0,
    observationTime: null,
  };

  return {
    location,
    observation,
    daily,
    hourly,
    issueTime: new Date().toISOString(),
    hourlyIssueTime: new Date().toISOString(),
    nextIssueTime: null,
    attribution: "Met Office",
  };
}

/** Lighter fetch for home panels — daily + obs, no hourly. */
export async function fetchLocationSnapshot(
  geohash: string,
): Promise<LocationSnapshot | null> {
  const forecast = await fetchLocationForecast(geohash);
  if (!forecast) return null;
  const { location, observation, daily } = forecast;
  if (daily.length === 0 && !observation) return null;

  return {
    location,
    observation,
    today: daily[0] ?? null,
    daily,
    issueTime: forecast.issueTime,
  };
}

export async function fetchCapitalSnapshots(): Promise<CapitalSnapshot[]> {
  const rows = await Promise.all(
    CAPITAL_CITIES.map(async (cap) => {
      try {
        const snap = await fetchLocationSnapshot(cap.geohash);
        const today = snap?.today;
        const obs = snap?.observation;
        const wind =
          obs?.windKmh != null
            ? `${obs.windDir || ""} ${Math.round(obs.windKmh)}`.trim()
            : null;
        return {
          city: cap.name,
          state: cap.state,
          geohash: cap.geohash,
          href: `/forecast/${cap.geohash}`,
          tempC:
            obs?.temp != null
              ? Math.round(obs.temp)
              : today?.tempNow != null
                ? Math.round(today.tempNow)
                : today?.tempMax ?? null,
          wind,
          condition: today?.shortText?.replace(/\.$/, "") || null,
          icon: today?.icon || null,
        } satisfies CapitalSnapshot;
      } catch {
        return {
          city: cap.name,
          state: cap.state,
          geohash: cap.geohash,
          href: `/forecast/${cap.geohash}`,
          tempC: null,
          wind: null,
          condition: null,
          icon: null,
        } satisfies CapitalSnapshot;
      }
    }),
  );
  return rows;
}

export function formatDateHeading(
  timeZone = "Europe/London",
  when: Date = new Date(),
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(when);
}

export function formatClockLabel(
  iso: string | null,
  timeZone = "Europe/London",
): string {
  if (!iso) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(new Date());
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d);
}

export function formatForecastDay(
  iso: string,
  timeZone = "Europe/London",
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatForecastHour(
  iso: string,
  timeZone = "Europe/London",
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hour12: true,
  }).format(d);
}

export function formatClock(
  iso: string | null,
  timeZone = "Europe/London",
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function rainLabel(
  chance: number | null,
  minMm: number | null,
  maxMm: number | null,
  units = "mm",
): string {
  if (chance == null) return "—";
  if (chance <= 0) return "0%";
  const amount =
    maxMm != null && maxMm > 0
      ? ` · ${minMm ?? 0}–${maxMm} ${units}`
      : minMm != null && minMm > 0
        ? ` · ${minMm} ${units}`
        : "";
  return `${chance}%${amount}`;
}

export function iconLabel(icon: string): string {
  return icon
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
