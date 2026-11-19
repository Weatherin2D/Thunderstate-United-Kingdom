/**
 * UK and European towns/cities for dense map labels.
 * This compatibility module retains the old AU_TOWNS export name while serving
 * the new UK/Europe location dataset.
 */

export type AuTown = {
  name: string;
  lat: number;
  lon: number;
  state: string;
  population: number;
};

export const AU_TOWNS: AuTown[] = [
  { name: "London", lat: 51.5074, lon: -0.1278, state: "England", population: 8799728 },
  { name: "Edinburgh", lat: 55.9533, lon: -3.1883, state: "Scotland", population: 506520 },
  { name: "Cardiff", lat: 51.4816, lon: -3.1791, state: "Wales", population: 372089 },
  { name: "Belfast", lat: 54.5973, lon: -5.9301, state: "Northern Ireland", population: 345418 },
  { name: "Dublin", lat: 53.3498, lon: -6.2603, state: "Ireland", population: 1380909 },
  { name: "Paris", lat: 48.8566, lon: 2.3522, state: "France", population: 11280000 },
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041, state: "Netherlands", population: 1148972 },
  { name: "Berlin", lat: 52.52, lon: 13.405, state: "Germany", population: 3677472 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038, state: "Spain", population: 3334730 },
  { name: "Rome", lat: 41.9028, lon: 12.4964, state: "Italy", population: 4342212 },
  { name: "Warsaw", lat: 52.2297, lon: 21.0122, state: "Poland", population: 1860281 },
  { name: "Vienna", lat: 48.2082, lon: 16.3738, state: "Austria", population: 1929944 },
  { name: "Prague", lat: 50.0755, lon: 14.4378, state: "Czechia", population: 1357326 },
  { name: "Barcelona", lat: 41.3874, lon: 2.1686, state: "Spain", population: 1620343 },
  { name: "Lisbon", lat: 38.7223, lon: -9.1393, state: "Portugal", population: 548703 },
  { name: "Brussels", lat: 50.8503, lon: 4.3517, state: "Belgium", population: 1211035 },
  { name: "Zurich", lat: 47.3769, lon: 8.5417, state: "Switzerland", population: 420217 },
  { name: "Stockholm", lat: 59.3293, lon: 18.0686, state: "Sweden", population: 975551 },
  { name: "Oslo", lat: 59.9139, lon: 10.7522, state: "Norway", population: 697010 },
  { name: "Copenhagen", lat: 55.6761, lon: 12.5683, state: "Denmark", population: 1363007 },
  { name: "Helsinki", lat: 60.1699, lon: 24.9384, state: "Finland", population: 658864 },
  { name: "Athens", lat: 37.9838, lon: 23.7275, state: "Greece", population: 1277966 },
];

export const UK_EUROPE_TOWNS = AU_TOWNS;

export type DeclutteredTown = AuTown & { labelOpacity: number };

export function declutterTownsWithFade(
  towns: AuTown[],
  zoom: number,
): DeclutteredTown[] {
  const limit = zoom >= 6 ? 28 : zoom >= 5 ? 18 : zoom >= 4 ? 12 : 8;
  return towns
    .slice()
    .sort((a, b) => b.population - a.population)
    .slice(0, limit)
    .map((town, index) => ({
      ...town,
      labelOpacity: Math.max(0.55, 1 - index * 0.018),
    }));
}

export function townDensityForBounds(
  bounds: [[number, number], [number, number]],
): number {
  const latSpan = bounds[1][0] - bounds[0][0];
  const lonSpan = bounds[1][1] - bounds[0][1];
  return latSpan * lonSpan > 120 ? 8 : latSpan * lonSpan > 40 ? 14 : 22;
}

export function declutterTowns(
  towns: AuTown[],
  limit: number,
): AuTown[] {
  return towns
    .slice()
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}

export function townOpacityByPopulationRank(
  population: number,
  towns: AuTown[],
): number {
  const ranked = towns
    .slice()
    .sort((a, b) => b.population - a.population);
  const rank = ranked.findIndex((town) => town.population === population);
  if (rank < 0) return 0.7;
  return Math.max(0.55, 1 - rank * 0.025);
}
