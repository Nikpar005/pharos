// Everything the user enters lives in IndexedDB on this device only.
// There is no account and no server. Clearing the browser's site data deletes it.
import { get, set } from 'idb-keyval';
import { emptyPlan, sanitizePlan, type Plan } from './plan';

export type Theme = 'auto' | 'light' | 'night';

export interface Settings {
  onboarded: boolean;
  country: string;
  lang: 'el' | 'en';
  theme: Theme;
  /** Two big buttons only, for older relatives. */
  simpleMode: boolean;
  /** Hidden developer details (7 taps on the logo). */
  devMode: boolean;
  /** ISO date of the last family drill. */
  lastDrillAt?: string;
}

export interface KitState {
  checked: Record<string, boolean>;
  /** ISO date of the last time the user ticked or reviewed the kit. */
  reviewedAt?: string;
}

export interface Saved {
  settings: Settings;
  plan: Plan;
  kit: KitState;
}

export function defaultSettings(): Settings {
  const lang = typeof navigator !== 'undefined' && navigator.language?.startsWith('el') ? 'el' : 'en';
  return { onboarded: false, country: 'gr', lang, theme: 'auto', simpleMode: false, devMode: false };
}

export async function loadAll(): Promise<Saved> {
  try {
    const [settings, plan, kit] = await Promise.all([get('settings'), get('plan'), get('kit')]);
    return {
      settings: { ...defaultSettings(), ...(settings as Partial<Settings> | undefined) },
      plan: sanitizePlan(plan) ?? emptyPlan(),
      kit: (kit as KitState | undefined) ?? { checked: {} }
    };
  } catch {
    // Private mode on some old browsers has no IndexedDB: run with defaults.
    return { settings: defaultSettings(), plan: emptyPlan(), kit: { checked: {} } };
  }
}

export function save<K extends keyof Saved>(key: K, value: Saved[K]): Promise<void> {
  return set(key, value).catch(() => undefined);
}

/**
 * Asks the browser not to evict our data when storage runs low. Called the
 * first time the user saves a plan, when keeping it matters.
 */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported: fine */
  }
}
