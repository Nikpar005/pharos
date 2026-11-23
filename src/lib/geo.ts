// Location helpers. GPS works without internet: the phone talks to the
// satellites directly. Only the first fix can be slower offline.
//
// Battery rules for this file:
// - one-shot reads by default (getPosition), never a background watch;
// - watchPosition only while a screen that needs it is open, and the caller
//   must stop it on unmount (see useWatchPosition in hooks.ts).

export interface Coords {
  lat: number;
  lon: number;
  accuracy?: number;
}

const R = 6371000; // Earth's mean radius in metres
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in metres. */
export function distance(a: Coords, b: Coords): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b, in degrees clockwise from north (0–360). */
export function bearing(a: Coords, b: Coords): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** 8-point compass index: 0 = N, 1 = NE … 7 = NW. */
export function compassPoint(bearingDeg: number): number {
  return Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8;
}

export function formatDistance(m: number, locale: string): string {
  const nf = (n: number, digits: number) =>
    n.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${nf(m / 1000, m < 10000 ? 1 : 0)} km`;
}

/** "37.97614, 23.73610": what you read out to a 112 operator. */
export function formatCoords(c: Coords): string {
  return `${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}`;
}

/** A link anyone can open later, on any phone, once they have internet. */
export function mapLink(c: Coords): string {
  const lat = c.lat.toFixed(5);
  const lon = c.lon.toFixed(5);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}

/** Opens the phone's maps app (which may have offline maps downloaded). */
export function geoUri(c: Coords, label?: string): string {
  const q = `${c.lat.toFixed(6)},${c.lon.toFixed(6)}`;
  return `geo:${q}?q=${q}${label ? `(${encodeURIComponent(label)})` : ''}`;
}

export type GeoError = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export function getPosition(timeoutMs = 20000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject('unsupported' satisfies GeoError);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject((e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable') satisfies GeoError),
      // A fix up to a minute old is fine and saves the GPS from waking up again.
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
