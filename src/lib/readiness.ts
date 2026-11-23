// "How ready are you?" — a 0–100 score from things the user has done.
// Pure function, unit tested. Weights favour what helps most in a real event.
import type { Plan } from './plan';
import type { KitState, Settings } from './storage';

export interface ReadinessInput {
  plan: Plan;
  kit: KitState;
  kitTotal: number;
  settings: Settings;
  mapsDownloaded: number;
  now?: number;
}

export interface ReadinessItem {
  id: 'contacts' | 'meeting' | 'outOfArea' | 'kit' | 'drill' | 'phone' | 'map';
  points: number;
  max: number;
  path: string;
}

const SIX_MONTHS = 182 * 24 * 60 * 60 * 1000;

export function readiness(i: ReadinessInput): { score: number; items: ReadinessItem[] } {
  const now = i.now ?? Date.now();
  const kitDone = Object.values(i.kit.checked).filter(Boolean).length;
  const drillFresh = !!i.settings.lastDrillAt && now - new Date(i.settings.lastDrillAt).getTime() <= SIX_MONTHS;
  const items: ReadinessItem[] = [
    { id: 'contacts', max: 15, points: i.plan.contacts.some((c) => c.phone.trim()) ? 15 : 0, path: 'plan' },
    { id: 'meeting', max: 15, points: i.plan.near.coords ? 15 : i.plan.near.label.trim() ? 8 : 0, path: 'plan' },
    { id: 'outOfArea', max: 10, points: i.plan.outOfArea.phone.trim() ? 10 : 0, path: 'plan' },
    { id: 'kit', max: 25, points: i.kitTotal ? Math.round((25 * Math.min(kitDone, i.kitTotal)) / i.kitTotal) : 0, path: 'kit' },
    { id: 'drill', max: 15, points: drillFresh ? 15 : 0, path: 'drill' },
    { id: 'phone', max: 10, points: i.settings.phoneSetupDone ? 10 : 0, path: 'setup' },
    { id: 'map', max: 10, points: i.mapsDownloaded > 0 ? 10 : 0, path: 'map' }
  ];
  return { score: items.reduce((s, x) => s + x.points, 0), items };
}
