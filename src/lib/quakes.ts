// Recent earthquakes, only when online and only when the user opens the screen.
// Primary: EMSC SeismicPortal (European, CC BY 4.0). Fallback: USGS.
// This is information, NOT an official warning; the app says so on screen.

export interface Quake {
  id: string;
  time: Date;
  mag: number;
  place: string;
  lat: number;
  lon: number;
  depthKm: number;
  source: 'EMSC' | 'USGS';
}

/** Greece and surroundings. */
export const AREA = { minlat: 34, maxlat: 42, minlon: 19, maxlon: 30 };

type Feature = { id?: string; geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> };

/** The features array of a GeoJSON response, or [] for anything malformed. */
function featuresOf(json: unknown): Feature[] {
  const f = (json as { features?: unknown } | null)?.features;
  return Array.isArray(f) ? (f.filter((x) => x && typeof x === 'object') as Feature[]) : [];
}

export function parseEmsc(json: unknown): Quake[] {
  return featuresOf(json)
    .map((f) => {
      const p = f.properties ?? {};
      return {
        id: String(p.unid ?? f.id ?? ''),
        time: new Date(String(p.time)),
        mag: Number(p.mag),
        place: String(p.flynn_region ?? ''),
        lat: Number(p.lat ?? f.geometry?.coordinates?.[1]),
        lon: Number(p.lon ?? f.geometry?.coordinates?.[0]),
        depthKm: Number(p.depth ?? 0),
        source: 'EMSC' as const
      };
    })
    .filter((q) => q.id && Number.isFinite(q.mag) && !Number.isNaN(q.time.getTime()));
}

export function parseUsgs(json: unknown): Quake[] {
  return featuresOf(json)
    .map((f) => {
      const p = f.properties ?? {};
      const c = f.geometry?.coordinates ?? [];
      return {
        id: String(f.id ?? ''),
        time: new Date(Number(p.time)),
        mag: Number(p.mag),
        place: String(p.place ?? ''),
        lat: Number(c[1]),
        lon: Number(c[0]),
        depthKm: Number(c[2] ?? 0),
        source: 'USGS' as const
      };
    })
    .filter((q) => q.id && Number.isFinite(q.mag) && !Number.isNaN(q.time.getTime()));
}

function qs(o: Record<string, string | number>): string {
  return Object.entries(o)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export async function fetchQuakes(minMag = 2.5, hours = 48): Promise<Quake[]> {
  const start = new Date(Date.now() - hours * 3_600_000).toISOString().slice(0, 19);
  const common = { ...AREA, minmag: minMag, starttime: start, orderby: 'time' };
  const signal = AbortSignal.timeout?.(10000);
  try {
    const r = await fetch(`https://www.seismicportal.eu/fdsnws/event/1/query?${qs({ ...common, format: 'json', limit: 50 })}`, { signal });
    if (r.ok) return parseEmsc(await r.json());
  } catch {
    /* try the fallback */
  }
  const r = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${qs({ ...common, format: 'geojson', limit: 50 })}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseUsgs(await r.json());
}
