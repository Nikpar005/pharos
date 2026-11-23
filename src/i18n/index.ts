// A tiny i18n: one flat JSON per language, {placeholders}. Only the user's
// language is downloaded at start-up; others load when chosen.
import type en from './en.json';

export type Lang = 'el' | 'en';
export type Key = keyof typeof en;

const dicts: Partial<Record<Lang, Record<string, string>>> = {};
const loaders: Record<Lang, () => Promise<{ default: Record<string, string> }>> = {
  el: () => import('./el.json'),
  en: () => import('./en.json')
};

export const languages: { code: Lang; name: string }[] = [
  { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' }
];

export async function loadLanguage(lang: Lang): Promise<void> {
  if (!dicts[lang]) dicts[lang] = (await loaders[lang]()).default;
}

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const d = dicts[lang] ?? dicts.en ?? dicts.el ?? {};
  const text = d[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}
