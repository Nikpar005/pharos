// A timestamped log of what happened during an emergency (CPR started, AED
// shock, aspirin given…), to show the ambulance crew. Stored on the device.
import { get, set } from 'idb-keyval';

export type EventType = 'cpr-start' | 'cpr-stop' | 'aed-shock' | 'aspirin' | 'adrenaline' | 'conscious' | 'call-112' | 'note';

export interface LogEvent {
  type: EventType;
  at: string; // ISO time
  note?: string;
}

const KEY = 'event-log';

export async function readLog(): Promise<LogEvent[]> {
  return ((await get<LogEvent[]>(KEY).catch(() => undefined)) ?? []).slice(-200);
}

export async function logEvent(type: EventType, note?: string): Promise<LogEvent[]> {
  const list = await readLog();
  list.push({ type, at: new Date().toISOString(), ...(note ? { note: note.slice(0, 200) } : {}) });
  await set(KEY, list).catch(() => undefined);
  return list;
}

export async function clearLog(): Promise<void> {
  await set(KEY, []).catch(() => undefined);
}

/** "12:41" in the user's locale. */
export function clock(iso: string, lang: string): string {
  return new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

/** "3:07" from milliseconds. */
export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
