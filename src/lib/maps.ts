// Offline map files: download, store on the device, list and delete.
//
// Storage: the Origin Private File System when the browser can stream into it
// (no need to hold a 50 MB file in memory on an old phone), otherwise a Blob
// in IndexedDB. Either way the file never leaves the device.
import { del, get, keys, set } from 'idb-keyval';
import { isPoiFile, type PoiFile } from './pois';

const FONT_RANGES = ['0-255', '256-511', '768-1023', '7936-8191', '8192-8447'];
export const FONT_STACK = 'Noto Sans Regular';

export function mapUrl(id: string): string {
  return `${import.meta.env.BASE_URL}maps/${id}.pmtiles`;
}
export function poisUrl(id: string): string {
  return `${import.meta.env.BASE_URL}maps/${id}.pois.json`;
}
export function glyphsUrl(): string {
  return `${location.origin}${import.meta.env.BASE_URL}map/fonts/{fontstack}/{range}.pbf`;
}

const META = (id: string) => `map-meta:${id}`;
const POIS = (id: string) => `map-pois:${id}`;
const BLOB = (id: string) => `map-blob:${id}`;

export interface MapMeta {
  id: string;
  bytes: number;
  downloadedAt: string;
  storage: 'opfs' | 'idb';
}

async function opfsDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const root = await navigator.storage?.getDirectory?.();
    return root ? await root.getDirectoryHandle('maps', { create: true }) : null;
  } catch {
    return null;
  }
}

/** Size of the remote file in bytes (HEAD request), or null when offline/unknown. */
export async function remoteSize(id: string): Promise<number | null> {
  try {
    const res = await fetch(mapUrl(id), { method: 'HEAD', cache: 'no-store' });
    const len = Number(res.headers.get('content-length'));
    return res.ok && len > 0 ? len : null;
  } catch {
    return null;
  }
}

export async function listDownloaded(): Promise<MapMeta[]> {
  const all = await keys().catch(() => []);
  const metas = await Promise.all(
    all.filter((k) => typeof k === 'string' && k.startsWith('map-meta:')).map((k) => get<MapMeta>(k))
  );
  return metas.filter((m): m is MapMeta => !!m);
}

/** Downloads a region and its label fonts. `onProgress` gets 0..1 (or -1 if size unknown). */
export async function downloadRegion(id: string, onProgress: (p: number) => void, signal?: AbortSignal): Promise<MapMeta> {
  const res = await fetch(mapUrl(id), { cache: 'no-store', signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  let received = 0;
  const progress = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      received += chunk.byteLength;
      onProgress(total ? received / total : -1);
      ctrl.enqueue(chunk);
    }
  });
  const body = res.body.pipeThrough(progress);

  let storage: MapMeta['storage'] = 'idb';
  const dir = await opfsDir();
  const fileHandle = dir ? await dir.getFileHandle(`${id}.pmtiles`, { create: true }).catch(() => null) : null;
  const canStream = !!fileHandle && 'createWritable' in fileHandle;
  if (fileHandle && canStream) {
    const writable = await (fileHandle as FileSystemFileHandle & { createWritable: () => Promise<WritableStream> }).createWritable();
    await body.pipeTo(writable, { signal });
    storage = 'opfs';
  } else {
    const blob = await new Response(body).blob();
    await set(BLOB(id), blob);
  }

  // Emergency places for "Nearby" (small JSON). Optional: older map builds lack it.
  try {
    const r = await fetch(poisUrl(id), { cache: 'no-store', signal });
    if (r.ok) {
      const data: unknown = await r.json();
      if (isPoiFile(data)) await set(POIS(id), data);
    }
  } catch {
    /* map still works without it */
  }

  // Label fonts go into the service worker's runtime cache (see vite.config.ts).
  await Promise.all(
    FONT_RANGES.map((r) => fetch(glyphsUrl().replace('{fontstack}', encodeURIComponent(FONT_STACK)).replace('{range}', r)).catch(() => null))
  );

  const meta: MapMeta = { id, bytes: received, downloadedAt: new Date().toISOString(), storage };
  await set(META(id), meta);
  await navigator.storage?.persist?.().catch(() => false);
  return meta;
}

/** The stored map as a File, ready for the PMTiles reader. */
export async function getRegionFile(id: string): Promise<File | null> {
  const meta = await get<MapMeta>(META(id));
  if (!meta) return null;
  if (meta.storage === 'opfs') {
    const dir = await opfsDir();
    const h = await dir?.getFileHandle(`${id}.pmtiles`).catch(() => null);
    return h ? h.getFile() : null;
  }
  const blob = await get<Blob>(BLOB(id));
  return blob ? new File([blob], `${id}.pmtiles`) : null;
}

/** Emergency places of every downloaded region. */
export async function getAllPois(): Promise<PoiFile[]> {
  const metas = await listDownloaded();
  const files = await Promise.all(metas.map((m) => get<PoiFile>(POIS(m.id)).catch(() => undefined)));
  return files.filter(isPoiFile);
}

export async function deleteRegion(id: string): Promise<void> {
  await del(POIS(id));
  const dir = await opfsDir();
  await dir?.removeEntry(`${id}.pmtiles`).catch(() => undefined);
  await del(BLOB(id));
  await del(META(id));
}

export function formatMB(bytes: number, locale: string): string {
  return `${(bytes / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}
