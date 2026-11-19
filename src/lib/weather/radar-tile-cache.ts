/** Process-local LRU cache for MeteoPool EU radar tiles (pre-coloured WebP). */

type CacheEntry = {
  body: Buffer;
  cachedAt: number;
};

const g = globalThis as unknown as {
  __skywatchRadarTileCache?: Map<string, CacheEntry>;
};

function store(): Map<string, CacheEntry> {
  if (!g.__skywatchRadarTileCache) g.__skywatchRadarTileCache = new Map();
  return g.__skywatchRadarTileCache;
}

const MAX_ENTRIES = 2400;
const TTL_MS = 10 * 60 * 1000;

export function radarTileCacheKey(
  ts: string,
  _path: string,
  z: number,
  x: number,
  y: number,
): string {
  // v10: MeteoPool EU OPERA composite tiles (512px WebP, z8 native)
  return `${ts}|${z}/${x}/${y}|v10`;
}

export function getCachedRadarTile(key: string): Buffer | null {
  const entry = store().get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    store().delete(key);
    return null;
  }
  // Refresh LRU order
  store().delete(key);
  store().set(key, entry);
  return entry.body;
}

export function setCachedRadarTile(key: string, body: Buffer): void {
  const cache = store();
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { body, cachedAt: Date.now() });
}
