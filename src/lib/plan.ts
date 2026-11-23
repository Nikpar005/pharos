// The family plan and how it moves between phones WITHOUT a server.
//
// Sharing works by putting the whole plan in the #fragment of a link:
//   https://<host>/#/import/z.<base64url(deflate(json))>
// The part after # is never sent to any server, not even ours, so the plan
// travels only inside the QR code or the message the user chooses to send.
// Scanning the QR with any camera app opens Pharos with the plan ready to import.

import type { Coords } from './geo';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  /** Included by default when sending "I'm okay". */
  checkIn: boolean;
}

export interface MeetingPoint {
  label: string;
  coords?: Coords;
}

export interface Member {
  id: string;
  name: string;
  /** Medicines, allergies, mobility… written by the user, shown as-is. */
  needs: string;
}

export interface Plan {
  v: 1;
  contacts: Contact[];
  near: MeetingPoint;
  far: MeetingPoint;
  outOfArea: { name: string; phone: string };
  members: Member[];
}

export function emptyPlan(): Plan {
  return {
    v: 1,
    contacts: [],
    near: { label: '' },
    far: { label: '' },
    outOfArea: { name: '', phone: '' },
    members: []
  };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// --- validation of untrusted input (imported links) ----------------------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function coords(v: unknown): Coords | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const lat = num(o.lat);
  const lon = num(o.lon);
  if (lat === undefined || lon === undefined || Math.abs(lat) > 90 || Math.abs(lon) > 180) return undefined;
  return { lat, lon };
}

function point(v: unknown): MeetingPoint {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const c = coords(o.coords);
  return c ? { label: str(o.label, 120), coords: c } : { label: str(o.label, 120) };
}

/** Turns anything (e.g. JSON from a scanned link) into a safe Plan, or null. */
export function sanitizePlan(input: unknown): Plan | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  if (o.v !== 1) return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 20) : []);
  const ooa = (o.outOfArea && typeof o.outOfArea === 'object' ? o.outOfArea : {}) as Record<string, unknown>;
  return {
    v: 1,
    contacts: list(o.contacts).map((c: Record<string, unknown>) => ({
      id: str(c?.id, 20) || newId(),
      name: str(c?.name, 60),
      phone: str(c?.phone, 30),
      checkIn: c?.checkIn !== false
    })),
    near: point(o.near),
    far: point(o.far),
    outOfArea: { name: str(ooa.name, 60), phone: str(ooa.phone, 30) },
    members: list(o.members).map((m: Record<string, unknown>) => ({
      id: str(m?.id, 20) || newId(),
      name: str(m?.name, 60),
      needs: str(m?.needs, 300)
    }))
  };
}

// --- encoding --------------------------------------------------------------

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** Drops ids and empty fields so the QR code stays small and easy to scan. */
function compact(plan: Plan): unknown {
  return {
    v: 1,
    contacts: plan.contacts.map(({ name, phone, checkIn }) => ({ name, phone, ...(checkIn ? {} : { checkIn }) })),
    near: plan.near,
    far: plan.far,
    outOfArea: plan.outOfArea,
    members: plan.members.map(({ name, needs }) => ({ name, needs }))
  };
}

/** "z.<data>" when compressed, "j.<data>" on browsers without CompressionStream. */
export async function encodePlan(plan: Plan): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(compact(plan)));
  if (canCompress()) return 'z.' + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
  return 'j.' + toBase64Url(json);
}

export async function decodePlan(data: string): Promise<Plan | null> {
  try {
    const [kind, payload] = [data.slice(0, 2), data.slice(2)];
    if (payload.length > 8000) return null;
    let bytes = fromBase64Url(payload);
    if (kind === 'z.') {
      if (!canCompress()) return null;
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    } else if (kind !== 'j.') {
      return null;
    }
    return sanitizePlan(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function shareUrl(origin: string, basePath: string, encoded: string): string {
  return `${origin}${basePath}#/import/${encoded}`;
}
