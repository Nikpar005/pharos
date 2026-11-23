// A 20-line i18n instead of a library: one flat JSON per language,
// {placeholders}, English fallback. Translators only touch the JSON files.
import el from './el.json';
import en from './en.json';

export type Lang = 'el' | 'en';
export type Key = keyof typeof en;

const dicts: Record<Lang, Record<string, string>> = { el, en };

export const languages: { code: Lang; name: string }[] = [
  { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' }
];

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const text = dicts[lang][key] ?? dicts.en[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

export const dictionaries = dicts;
