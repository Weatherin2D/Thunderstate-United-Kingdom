import type { SoundingStation } from "@/lib/weather/sounding-types";

/** UK and European radiosonde / upper-air sites (UWYO WMO stations). */
export const SOUNDING_STATIONS: SoundingStation[] = [
  { wmo: "03772", name: "Camborne", state: "ENG", lat: 50.218, lon: -5.326 },
  { wmo: "03005", name: "Lerwick", state: "SCT", lat: 60.139, lon: -1.183 },
  { wmo: "03502", name: "Aberporth", state: "WLS", lat: 52.139, lon: -4.57 },
  { wmo: "03920", name: "Belfast", state: "NIR", lat: 54.5, lon: -6.35 },
  { wmo: "03953", name: "Valentia", state: "IRE", lat: 51.938, lon: -10.243 },
  { wmo: "07145", name: "Trappes", state: "FRA", lat: 48.774, lon: 2.009 },
  { wmo: "10393", name: "Lindenberg", state: "DEU", lat: 52.208, lon: 14.118 },
  { wmo: "06260", name: "De Bilt", state: "NLD", lat: 52.1, lon: 5.18 },
  { wmo: "08023", name: "La Coruna", state: "ESP", lat: 43.366, lon: -8.416 },
  { wmo: "16245", name: "Pratica di Mare", state: "ITA", lat: 41.655, lon: 12.448 },
  { wmo: "12374", name: "Legionowo", state: "POL", lat: 52.407, lon: 20.955 },
  { wmo: "11035", name: "Vienna", state: "AUT", lat: 48.248, lon: 16.356 },
];

export function getSoundingStation(wmo: string): SoundingStation | null {
  return SOUNDING_STATIONS.find((station) => station.wmo === wmo) ?? null;
}

export function nearestSoundingStation(
  lat: number,
  lon: number,
): SoundingStation {
  let best = SOUNDING_STATIONS[0]!;
  let bestDistance = Infinity;
  for (const station of SOUNDING_STATIONS) {
    const distance =
      (station.lat - lat) ** 2 +
      ((station.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return best;
}
