/**
 * Client-safe MetEye thunderstorm constants (no Node/pngjs imports).
 */

/** Geographic frame matching WMS GetMap BBOX (Leaflet ImageOverlay). */
export const MET_OFFICE_METEYE_IMAGE_BOUNDS: [[number, number], [number, number]] = [
  [34.0, -12.0], // SW
  [62.0, 25.0], // NE
];

/** Thunderstorm legend colours for the UK/Europe frame. */
export const METEYE_THUNDERSTORM_CATEGORIES = [
  {
    id: "tstm_chance",
    label: "Chance of Thunderstorms",
    color: "#00B193",
    rank: 1,
  },
  {
    id: "tstm_likely",
    label: "Thunderstorms Likely",
    color: "#DB0303",
    rank: 2,
  },
] as const;

export type MeteyeCategoryId =
  (typeof METEYE_THUNDERSTORM_CATEGORIES)[number]["id"];
