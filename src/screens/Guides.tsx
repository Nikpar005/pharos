import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon, type IconName } from '../components/Icon';
import type { Key } from '../i18n';
import { Screen, BackLink, CallButton, DraftBanner, SectionTitle } from '../components/ui';
import { guides, getGuide, pick } from '../content';
import { href } from '../router';
import { NotFound } from './NotFound';

const more: { path: string; icon: IconName; title: Key; sub: Key }[] = [
  { path: 'map', icon: 'map', title: 'tools.map', sub: 'map.sub' },
  { path: 'quakes', icon: 'earthquake', title: 'quakes.title', sub: 'quakes.listSub' },
  { path: 'drill', icon: 'clock', title: 'drill.title', sub: 'drill.listSub' },
  { path: 'battery', icon: 'battery', title: 'battery.title', sub: 'battery.listSub' }
];

export function GuideList() {
  const { t, lang, country, setSettings } = useStore();
  return (
    <Screen tab="guides">
      <h1 class="title-l">{t('guides.title')}</h1>
      <div class="list">
        {guides.map((g) => (
          <a key={g.id} class="list-row" href={href(`guides/${g.id}`)}>
            <span class="badge-icon">
              <Icon name={g.icon} size={24} />
            </span>
            <span class="list-main">
              <span class="list-title">{pick(g.locales, lang).title}</span>
              <span class="list-sub">{pick(g.locales, lang).now}</span>
            </span>
          </a>
        ))}
      </div>

      <SectionTitle>{t('guides.more')}</SectionTitle>
      <div class="list">
        {more.map((m) => (
          <a key={m.path} class="list-row" href={href(m.path)}>
            <span class="badge-icon">
              <Icon name={m.icon} size={22} />
            </span>
            <span class="list-main">
              <span class="list-title">{t(m.title)}</span>
              <span class="list-sub">{t(m.sub)}</span>
            </span>
          </a>
        ))}
        <button class="list-row list-button" onClick={() => setSettings({ simpleMode: true })}>
          <span class="badge-icon">
            <Icon name="eye" size={22} />
          </span>
          <span class="list-main">
            <span class="list-title">{t('simple.title')}</span>
            <span class="list-sub">{t('simple.sub')}</span>
          </span>
        </button>
      </div>

      <SectionTitle>{t('guides.numbers')}</SectionTitle>
      <div class="list">
        {country.numbers.map((n) => (
          <a key={n.number} class="list-row" href={`tel:${n.number}`}>
            <span class="number">{n.number}</span>
            <span class="list-title">{pick(n.locales, lang).label}</span>
          </a>
        ))}
      </div>
    </Screen>
  );
}

type Phase = 'before' | 'during' | 'after';
const phases: Phase[] = ['before', 'during', 'after'];

export function GuideDetail(props: { id: string }) {
  const { t, lang } = useStore();
  const [phase, setPhase] = useState<Phase>('during');
  const guide = getGuide(props.id);
  if (!guide) return <NotFound />;
  const text = pick(guide.locales, lang);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink to="guides" />
      <div class="guide-head">
        <span class="badge-icon dark">
          <Icon name={guide.icon} size={26} />
        </span>
        <h1 class="title-l">{text.title}</h1>
      </div>

      {guide.status === 'draft' && <DraftBanner />}

      <div class="segmented" role="tablist" aria-label={t('guide.phase')}>
        {phases.map((p) => (
          <button
            key={p}
            role="tab"
            id={`tab-${p}`}
            aria-selected={p === phase}
            aria-controls="steps"
            class={p === phase ? 'on' : undefined}
            onClick={() => setPhase(p)}
          >
            {t(`guide.${p}`)}
          </button>
        ))}
      </div>

      {phase === 'during' && (
        <div class="now-card">
          <span class="now-label">{t('guide.now')}</span>
          <span class="now-text">{text.now}</span>
        </div>
      )}

      <ol class="steps" id="steps" role="tabpanel" aria-labelledby={`tab-${phase}`}>
        {text[phase].map((s, i) => (
          <li key={`${phase}-${i}`}>
            <span class="step-n">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <div class="sources">
        {guide.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            {t('guide.source')}: {s.name} <Icon name="external" size={14} />
          </a>
        ))}
        {guide.status === 'reviewed' && <span>{t('guide.reviewed', { date: guide.last_reviewed })}</span>}
      </div>
    </Screen>
  );
}
