/** Real map overlays — only layers with working data sources. */
export const WEATHER_LAYERS = [
  { id: "lightning", label: "Lightning tracker" },
  { id: "synoptic", label: "Synoptic MSLP" },
  { id: "radar", label: "Rain radar" },
  { id: "stations", label: "Weather stations" },
  { id: "cells", label: "Cell tracking" },
] as const;

export type LayerId = (typeof WEATHER_LAYERS)[number]["id"];

/** Home + Satellite defaults. */
export const DEFAULT_WEATHER_LAYERS: Record<LayerId, boolean> = {
  lightning: true,
  synoptic: true,
  radar: false,
  stations: false,
  cells: false,
};

/** /radar page defaults (rain radar + stations first). */
export const DEFAULT_RADAR_WEATHER_LAYERS: Record<LayerId, boolean> = {
  lightning: true,
  synoptic: false,
  radar: true,
  stations: true,
  cells: true,
};

/** Cartographic toggles for the national map (below weather overlays). */
export const MAP_SETTINGS = [
  { id: "liveLocation", label: "Live location" },
  { id: "radarSmoothing", label: "Radar soft edges" },
  { id: "radarSites", label: "Radar sites" },
  { id: "bomWarnings", label: "Weather warnings" },
  { id: "forecastDistricts", label: "Forecast zone districts" },
  { id: "lightningBolts", label: "Lightning bolt icons" },
  { id: "stationColorValues", label: "Colour station values" },
  { id: "cityLabels", label: "City labels" },
  { id: "townLabels", label: "Town labels (dense)" },
  { id: "stateOutlines", label: "UK nation outlines" },
  { id: "stateLabels", label: "Nation labels" },
  { id: "outlines", label: "Coastlines" },
  { id: "oceanNames", label: "Ocean names" },
] as const;

export type MapSettingId = (typeof MAP_SETTINGS)[number]["id"];

/** Multiplier for lightning crosshair / bolt marker size. */
export const DEFAULT_LIGHTNING_ICON_SCALE = 1;
export const LIGHTNING_ICON_SCALE_MIN = 0.5;
export const LIGHTNING_ICON_SCALE_MAX = 2;
export const LIGHTNING_ICON_SCALE_STEP = 0.1;

export function clampLightningIconScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LIGHTNING_ICON_SCALE;
  const stepped =
    Math.round(value / LIGHTNING_ICON_SCALE_STEP) * LIGHTNING_ICON_SCALE_STEP;
  return Math.min(
    LIGHTNING_ICON_SCALE_MAX,
    Math.max(LIGHTNING_ICON_SCALE_MIN, Number(stepped.toFixed(1))),
  );
}

export type MapSettingsState = {
  [K in MapSettingId]: boolean;
} & {
  /** Crosshair / bolt size multiplier (0.5–2). */
  lightningIconScale: number;
};

/** Home + Satellite cartography defaults. */
export const DEFAULT_MAP_SETTINGS: MapSettingsState = {
  liveLocation: false,
  /**
   * Soft CSS upscale only — RainViewer spatial smooth (1_0) breaks our dBZ
   * recolour (blended pixels fall out of the Universal Blue LUT).
   */
  radarSmoothing: false,
  /** Show available UK/European radar site locations. */
  radarSites: false,
  /** Draw active UK/European severe weather warning areas. */
  bomWarnings: false,
  /** Label the forecast districts attached to active warning polygons. */
  forecastDistricts: false,
  /** Bolt glyphs instead of crosshair markers */
  lightningBolts: false,
  /** Thermal / pressure colour coding on station-model numbers */
  stationColorValues: false,
  cityLabels: true,
  /** Hundreds of regional towns (decluttered by zoom / region) */
  townLabels: true,
  stateOutlines: true,
  stateLabels: true,
  /** European coastline is on by default */
  outlines: true,
  oceanNames: true,
  lightningIconScale: DEFAULT_LIGHTNING_ICON_SCALE,
};

/** /satellite page cartography defaults. */
export const DEFAULT_SATELLITE_MAP_SETTINGS: MapSettingsState = {
  ...DEFAULT_MAP_SETTINGS,
};

/** /radar page cartography — bolts + coloured stations on. */
export const DEFAULT_RADAR_MAP_SETTINGS: MapSettingsState = {
  ...DEFAULT_MAP_SETTINGS,
  radarSites: false,
  bomWarnings: true,
  forecastDistricts: true,
  lightningBolts: true,
  stationColorValues: true,
};

/** Primary map view — not the same as overlay layers. */
export const MAP_MODES = ["Zoomable", "Static"] as const;

export type MapMode = (typeof MAP_MODES)[number];

/** Leaflet / GIBS crop bounds as [[south, west], [north, east]]. */
export type RegionBounds = [[number, number], [number, number]];

/**
 * Map region focus. The United Kingdom is the default; European regions and
 * the Europe-wide view are available as explicit selections.
 */
export const MAP_REGIONS = [
  {
    id: "national",
    label: "Europe-wide",
    short: "EUR",
    bounds: [
      [34, -12],
      [71, 32],
    ] as RegionBounds,
  },
  {
    id: "uk",
    label: "United Kingdom",
    short: "UK",
    bounds: [
      [49.5, -8.7],
      [59.5, 2.1],
    ] as RegionBounds,
  },
  {
    id: "england",
    label: "England",
    short: "ENG",
    bounds: [
      [49.8, -6.5],
      [55.9, 2.1],
    ] as RegionBounds,
  },
  {
    id: "scotland",
    label: "Scotland",
    short: "SCT",
    bounds: [
      [54.5, -8.6],
      [60.9, -0.6],
    ] as RegionBounds,
  },
  {
    id: "wales",
    label: "Wales",
    short: "WLS",
    bounds: [
      [51.3, -5.8],
      [53.6, -2.6],
    ] as RegionBounds,
  },
  {
    id: "ni",
    label: "Northern Ireland",
    short: "NIR",
    bounds: [
      [54, -8.2],
      [55.3, -5.3],
    ] as RegionBounds,
  },
  {
    id: "western-eu",
    label: "Western Europe",
    short: "WE",
    bounds: [
      [41, -11],
      [54.5, 9],
    ] as RegionBounds,
  },
  {
    id: "central-eu",
    label: "Central Europe",
    short: "CE",
    bounds: [
      [43, 3],
      [55.5, 18],
    ] as RegionBounds,
  },
  {
    id: "mediterranean",
    label: "Mediterranean",
    short: "MED",
    bounds: [
      [35, -10],
      [47, 30],
    ] as RegionBounds,
  },
] as const;

export type MapRegionId = (typeof MAP_REGIONS)[number]["id"];

export const DEFAULT_MAP_REGION: MapRegionId = "uk";

export function getMapRegion(
  id: MapRegionId = DEFAULT_MAP_REGION,
): (typeof MAP_REGIONS)[number] {
  return MAP_REGIONS.find((r) => r.id === id) ?? MAP_REGIONS[0]!;
}

export function isMapRegionId(value: string): value is MapRegionId {
  return MAP_REGIONS.some((r) => r.id === value);
}

/** Demo “now” for London — shared so every panel stays consistent. */
export const LONDON_NOW = {
  place: "London, England",
  condition: "Partly cloudy",
  tempC: 22,
  feelsLikeC: 21,
  humidityPct: 68,
  wind: "18 km/h SSW",
  gusts: "32 km/h",
  rainTodayMm: 0,
  pressureHpa: 1013,
  minC: 16,
  maxC: 22,
  rainChancePct: 10,
  uv: "6 High",
  /** Fixed demo clock so labels stay stable in the shell. */
  clockLabel: "Wed 16 Sep · 4:32 PM BST",
  dateHeading: "Wednesday 16 September",
} as const;

export const WARNINGS = [
  {
    id: "uk-ts",
    states: ["UK"],
    title: "Severe Thunderstorm Warning",
    detail: "Southern England — damaging winds & large hail possible",
    tone: "amber",
  },
  {
    id: "uk-flood",
    states: ["UK"],
    title: "Flood Warning",
    detail: "South-west England catchments — heavy rain ongoing",
    tone: "sky",
  },
  {
    id: "uk-marine",
    states: ["UK"],
    title: "Marine Wind Warning",
    detail: "English Channel — strong winds & hazardous seas",
    tone: "violet",
  },
  {
    id: "eu-storm",
    states: ["EU"],
    title: "European Severe Storm Watch",
    detail: "Western Europe — monitoring developing storms",
    tone: "cyan",
  },
] as const;

/** @deprecated Prefer live `/api/weather/warnings` states. */
export function warningStates(): string[] {
  const set = new Set<string>();
  for (const w of WARNINGS) {
    for (const s of w.states) set.add(s);
  }
  return [...set];
}

/** UK/Europe briefing notes — not a repeat of the warning titles. */
export const HIGHLIGHTS = [
  "Thunderstorms expected across south-east England later this afternoon",
  "Warm, humid air spreading across central Europe through the weekend",
  "Fresh Atlantic winds easing around the UK coast overnight",
] as const;

/** Starts on “today” (Wed) so it matches LONDON_NOW. */
export const WEEK_FORECAST = [
  { day: "Wed", high: 22, low: 16, icon: "partly" },
  { day: "Thu", high: 21, low: 15, icon: "rain" },
  { day: "Fri", high: 19, low: 14, icon: "storm" },
  { day: "Sat", high: 20, low: 13, icon: "cloud" },
  { day: "Sun", high: 23, low: 15, icon: "sun" },
  { day: "Mon", high: 25, low: 16, icon: "partly" },
  { day: "Tue", high: 24, low: 17, icon: "sun" },
] as const;

/** @deprecated Home model panel uses live Open-Meteo comparison. */
export const MODEL_ROWS = [
  { metric: "Max Temp", ecmwf: "22°", access: "23°", gfs: "21°" },
  { metric: "Rain", ecmwf: "1 mm", access: "0 mm", gfs: "2 mm" },
  { metric: "Wind (km/h)", ecmwf: "18", access: "20", gfs: "17" },
  { metric: "Storm Chance", ecmwf: "40%", access: "35%", gfs: "45%" },
] as const;

export const CAPITAL_NOW = [
  { city: "London", tempC: 22, wind: "SSW 18", condition: "Partly cloudy" },
  { city: "Edinburgh", tempC: 15, wind: "S 22", condition: "Cloudy" },
  { city: "Cardiff", tempC: 18, wind: "SW 25", condition: "Clearing" },
  { city: "Belfast", tempC: 16, wind: "W 20", condition: "Showers" },
  { city: "Dublin", tempC: 17, wind: "SW 18", condition: "Cloudy" },
  { city: "Paris", tempC: 24, wind: "SW 14", condition: "Mostly sunny" },
  { city: "Amsterdam", tempC: 20, wind: "W 16", condition: "Showers" },
  { city: "Berlin", tempC: 23, wind: "SE 12", condition: "Partly cloudy" },
] as const;

export const CITY_MARKERS: { name: string; lat: number; lon: number }[] = [
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Edinburgh", lat: 55.9533, lon: -3.1883 },
  { name: "Cardiff", lat: 51.4816, lon: -3.1791 },
  { name: "Belfast", lat: 54.5973, lon: -5.9301 },
  { name: "Dublin", lat: 53.3498, lon: -6.2603 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Berlin", lat: 52.52, lon: 13.405 },
];
