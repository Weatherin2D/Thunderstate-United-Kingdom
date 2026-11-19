/** Auto-curated Met Office forecast sample sites for national convective risk. */
export type BomRiskSite = {
  name: string;
  state: string;
  geohash: string;
  lat: number;
  lon: number;
};

export const MET_OFFICE_RISK_SITES: BomRiskSite[] = [
  { name: "London", state: "ENG", geohash: "uk-london", lat: 51.5074, lon: -0.1278 },
  { name: "Edinburgh", state: "SCT", geohash: "uk-edinburgh", lat: 55.9533, lon: -3.1883 },
  { name: "Cardiff", state: "WLS", geohash: "uk-cardiff", lat: 51.4816, lon: -3.1791 },
  { name: "Belfast", state: "NIR", geohash: "uk-belfast", lat: 54.5973, lon: -5.9301 },
  { name: "Dublin", state: "IRE", geohash: "ie-dublin", lat: 53.3498, lon: -6.2603 },
  { name: "Paris", state: "FRA", geohash: "fr-paris", lat: 48.8566, lon: 2.3522 },
  { name: "Amsterdam", state: "NLD", geohash: "nl-amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Berlin", state: "DEU", geohash: "de-berlin", lat: 52.52, lon: 13.405 },
  { name: "Madrid", state: "ESP", geohash: "es-madrid", lat: 40.4168, lon: -3.7038 },
  { name: "Rome", state: "ITA", geohash: "it-rome", lat: 41.9028, lon: 12.4964 },
  { name: "Warsaw", state: "POL", geohash: "pl-warsaw", lat: 52.2297, lon: 21.0122 },
  { name: "Vienna", state: "AUT", geohash: "at-vienna", lat: 48.2082, lon: 16.3738 },
  { name: "Manchester", state: "ENG", geohash: "uk-manchester", lat: 53.4808, lon: -2.2426 },
  { name: "Aberdeen", state: "SCT", geohash: "uk-aberdeen", lat: 57.1497, lon: -2.0943 },
  { name: "Brussels", state: "BEL", geohash: "be-brussels", lat: 50.8503, lon: 4.3517 },
  { name: "Prague", state: "CZE", geohash: "cz-prague", lat: 50.0755, lon: 14.4378 },
  { name: "Lisbon", state: "PRT", geohash: "pt-lisbon", lat: 38.7223, lon: -9.1393 },
];
