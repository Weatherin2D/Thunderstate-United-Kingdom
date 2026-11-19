/**
 * Vercel Hobby budget helpers.
 *
 * Hobby Fluid Compute is ~4h Active CPU / day. Radar PNG recolour, background
 * tile warm, satellite frame warm, and lightning PNG backfill were the main
 * burners that tripped fair-use on the previous account.
 *
 * Defaults: treat any Vercel deploy as Hobby-safe unless explicitly opted out.
 * Self-hosted / Docker keeps full compute unless SKYEUTCH_HOBBY=1.
 */

export function isHobbyBudget(): boolean {
  if (process.env.SKYEUTCH_FULL_COMPUTE === "1") return false;
  if (process.env.SKYEUTCH_HOBBY === "0") return false;
  if (process.env.SKYEUTCH_HOBBY === "1") return true;
  return process.env.VERCEL === "1";
}

/** Skip the CloudCountry dBZ palette proxy only when direct tiles are explicitly enabled. */
export function isDirectRadarTilesEnabled(): boolean {
  if (process.env.SKYEUTCH_RADAR_DIRECT === "0") return false;
  if (process.env.SKYEUTCH_RADAR_DIRECT === "1") return true;
  return false;
}

/** Allow server-side radar / satellite cache warming. */
export function allowBackgroundWarm(): boolean {
  if (process.env.SKYEUTCH_WARM === "1") return true;
  if (process.env.SKYEUTCH_WARM === "0") return false;
  return !isHobbyBudget();
}
