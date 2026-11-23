import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, CallButton, DraftBanner, SectionTitle } from '../components/ui';
import { pick } from '../content';
import { languages } from '../i18n';

type Loc<T> = Record<string, T>;
interface ExtrasData {
  setup: { status: string; sources: { name: string; url: string }[]; platforms: { id: string; locales: Loc<{ title: string; steps: string[] }> }[] };
  evacuation: {
    status: string;
    sources: { name: string; url: string }[];
    groups: { id: string; minutes: number; locales: Loc<{ title: string; items: string[] }> }[];
  };
  phrases: { languages: string[]; items: Record<string, string>[] };
}

// Loaded only when one of these screens opens (precached for offline).
let cache: Promise<ExtrasData> | null = null;
function useExtras(): ExtrasData | null {
  const [d, setD] = useState<ExtrasData | null>(null);
  useEffect(() => {
    cache ??= import('../generated/extras.json').then((m) => m.default as unknown as ExtrasData);
    cache.then(setD);
  }, []);
  return d;
}

function Sources(props: { list: { name: string; url: string }[] }) {
  const { t } = useStore();
  return (
    <div class="sources">
      {props.list.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
          {t('guide.source')}: {s.name} <Icon name="external" size={14} />
        </a>
      ))}
    </div>
  );
}

// ---- Set up your phone ------------------------------------------------------

export function PhoneSetup() {
  const { t, lang, settings, setSettings } = useStore();
  const d = useExtras();
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [platform, setPlatform] = useState(isIos ? 'iphone' : 'android');
  if (!d) return <Screen>{null}</Screen>;
  const current = d.setup.platforms.find((p) => p.id === platform) ?? d.setup.platforms[0]!;

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('setup.title')}</h1>
      <p class="lead">{t('setup.sub')}</p>
      {d.setup.status === 'draft' && <DraftBanner />}
      <div class="segmented two" role="tablist">
        {d.setup.platforms.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === platform} class={p.id === platform ? 'on' : undefined} onClick={() => setPlatform(p.id)}>
            {pick(p.locales, lang).title}
          </button>
        ))}
      </div>
      <ol class="steps">
        {pick(current.locales, lang).steps.map((s, i) => (
          <li key={i}>
            <span class="step-n">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p class="fineprint">{t('setup.namesDiffer')}</p>
      <label class="toggle-row">
        <span class="toggle-label">{t('setup.done')}</span>
        <input type="checkbox" checked={settings.phoneSetupDone} onChange={(e) => setSettings({ phoneSetupDone: e.currentTarget.checked })} />
      </label>
      <Sources list={d.setup.sources} />
    </Screen>
  );
}

// ---- Evacuate now -------------------------------------------------------------

export function Evacuate() {
  const { t, lang } = useStore();
  const d = useExtras();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!d) return <Screen>{null}</Screen>;
  const s = Math.floor((now - startedAt) / 1000);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{t('evac.title')}</h1>
      {d.evacuation.status === 'draft' && <DraftBanner />}
      <div class="timer" aria-live="off">
        {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
      </div>
      <p class="muted center">{t('evac.leave')}</p>
      {d.evacuation.groups.map((g) => (
        <section key={g.id}>
          <SectionTitle>{pick(g.locales, lang).title}</SectionTitle>
          <div class="list">
            {pick(g.locales, lang).items.map((item, i) => {
              const k = `${g.id}-${i}`;
              return (
                <label key={k} class={checked[k] ? 'list-row check-row done' : 'list-row check-row'}>
                  <input type="checkbox" checked={!!checked[k]} onChange={(e) => setChecked({ ...checked, [k]: e.currentTarget.checked })} />
                  <span class="list-title">{item}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <Sources list={d.evacuation.sources} />
    </Screen>
  );
}

// ---- Phrase card -----------------------------------------------------------------

const NAMES: Record<string, string> = { en: 'English', de: 'Deutsch', fr: 'Français', it: 'Italiano' };

export function Phrases() {
  const { t } = useStore();
  const d = useExtras();
  const [lang, setLang] = useState('en');
  const [big, setBig] = useState<Record<string, string> | null>(null);
  if (!d) return <Screen>{null}</Screen>;

  if (big) {
    // Full screen, huge Greek text to show to someone nearby.
    return (
      <div class="phrase-full" onClick={() => setBig(null)} role="button" tabIndex={0}>
        <span class="phrase-el" lang="el">
          {big.el}
        </span>
        <span class="phrase-tr">{big[lang]}</span>
        <span class="blackout-hint">{t('phrases.tapBack')}</span>
      </div>
    );
  }

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('phrases.title')}</h1>
      <p class="muted">{t('phrases.sub')}</p>
      <div class="field">
        <label for="plang">{t('welcome.language')}</label>
        <select id="plang" value={lang} onChange={(e) => setLang(e.currentTarget.value)}>
          {d.phrases.languages.map((l) => (
            <option key={l} value={l}>
              {NAMES[l] ?? languages.find((x) => x.code === l)?.name ?? l}
            </option>
          ))}
        </select>
      </div>
      <div class="list">
        {d.phrases.items.map((p) => (
          <button key={p.id} class="list-row list-button phrase-row" onClick={() => setBig(p)}>
            <span class="list-main">
              <span class="list-title">{p[lang]}</span>
              <span class="list-sub" lang="el">
                {p.el}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
