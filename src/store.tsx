import { createContext, type ComponentChildren } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';
import { save, requestPersistence, type Saved, type Settings, type KitState } from './lib/storage';
import type { Plan } from './lib/plan';
import { loadLanguage, translate, type Key, type Lang } from './i18n';
import { getCountry, type Country } from './content';

interface Store extends Saved {
  lang: Lang;
  country: Country;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  setSettings: (patch: Partial<Settings>) => void;
  setPlan: (plan: Plan) => void;
  setKit: (kit: KitState) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider(props: { initial: Saved; children: ComponentChildren }) {
  const [state, setState] = useState<Saved>(props.initial);

  const store = useMemo<Store>(() => {
    const lang = state.settings.lang;
    const country = getCountry(state.settings.country);
    return {
      ...state,
      lang,
      country,
      t: (key, vars) => translate(lang, key, { emergency: country.emergency, ...vars }),
      setSettings(patch) {
        const settings = { ...state.settings, ...patch };
        const apply = () => {
          setState((s) => ({ ...s, settings }));
          save('settings', settings);
        };
        // A new language's text must be loaded before the screen re-renders.
        if (patch.lang && patch.lang !== state.settings.lang) loadLanguage(patch.lang).then(apply, apply);
        else apply();
      },
      setPlan(plan) {
        setState((s) => ({ ...s, plan }));
        save('plan', plan);
        requestPersistence();
      },
      setKit(kit) {
        setState((s) => ({ ...s, kit }));
        save('kit', kit);
      }
    };
  }, [state]);

  return <Ctx.Provider value={store}>{props.children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
