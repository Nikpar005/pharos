import { useRef } from 'preact/hooks';
import { useStore } from '../store';
import { Icon, type IconName } from '../components/Icon';
import { Screen, CallButton } from '../components/ui';
import { LowBattery } from '../components/LowBattery';
import { guides, pick } from '../content';
import { href, navigate } from '../router';
import { SimpleHome } from './SimpleHome';
import { ReadyCard } from './Ready';
import { Logo } from '../components/Logo';
import type { Key } from '../i18n';

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;

const tools: { path: string; icon: IconName; key: Key }[] = [
  { path: 'firstaid', icon: 'firstaid', key: 'firstaid.title' },
  { path: 'cpr', icon: 'heart', key: 'tools.cpr' },
  { path: 'evacuate', icon: 'run', key: 'evac.short' },
  { path: 'trapped', icon: 'volume', key: 'tools.trapped' },
  { path: 'sos', icon: 'flash', key: 'tools.sos' },
  { path: 'phrases', icon: 'globe', key: 'phrases.short' },
  { path: 'map', icon: 'map', key: 'tools.map' },
  { path: 'quakes', icon: 'earthquake', key: 'quakes.title' }
];

export function Home() {
  const { t, lang, plan, settings, setSettings } = useStore();
  const taps = useRef<number[]>([]);
  if (settings.simpleMode) return <SimpleHome />;

  const hasMeetingPoint = !!plan.near.coords;
  const night =
    settings.theme === 'night' ||
    (settings.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const drillDue = !settings.lastDrillAt || Date.now() - new Date(settings.lastDrillAt).getTime() > SIX_MONTHS_MS;

  // Hidden developer panel: 7 taps on the logo within 3 seconds.
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 7) {
      taps.current = [];
      setSettings({ devMode: true });
      navigate('battery');
    }
  };

  return (
    <Screen tab="home">
      <header class="topbar">
        <div class="brand">
          <span class="logo" onClick={onLogoTap}>
            <Logo size={44} />
          </span>
          <span>Pharos</span>
        </div>
        <div class="topbar-actions">
        <a class="icon-btn" href={href('settings')} aria-label={t('settings.title')}>
          <Icon name="settings" size={22} />
        </a>
        <button
          class="icon-btn"
          aria-label={t('settings.night')}
          aria-pressed={night}
          onClick={() => setSettings({ theme: night ? 'light' : 'night' })}
        >
          <Icon name="moon" size={22} />
        </button>
        </div>
      </header>

      <LowBattery />

      <h1 class="title-xl pre">{t('home.title')}</h1>

      <CallButton />

      <a class="big-action big-safe" href={href('ok')}>
        <span class="big-icon">
          <Icon name="checkCircle" size={28} />
        </span>
        <span class="big-text">
          <span class="big-title">{t('home.ok')}</span>
          <span class="big-sub">{t('home.okSub')}</span>
        </span>
      </a>

      <div class="row-2">
        <a class="chip-link" href={href('where')}>
          <Icon name="crosshair" size={20} />
          <span>{t('home.where')}</span>
        </a>
        <a class="chip-link" href={href(hasMeetingPoint ? 'go/near' : 'plan')}>
          <Icon name="pin" size={20} />
          <span>{t('home.meet')}</span>
        </a>
      </div>

      <a class="big-action big-nearby" href={href('nearby')}>
        <span class="big-icon">
          <Icon name="pin" size={26} />
        </span>
        <span class="big-text">
          <span class="big-title small">{t('nearby.title')}</span>
          <span class="big-sub">{t('nearby.homeSub')}</span>
        </span>
      </a>

      <h2 class="title-s">{t('home.what')}</h2>
      <div class="grid-2">
        {guides.map((g) => (
          <a key={g.id} class="hazard" href={href(`guides/${g.id}`)}>
            <Icon name={g.icon} size={28} />
            <span>{pick(g.locales, lang).title}</span>
          </a>
        ))}
      </div>

      <h2 class="title-s">{t('home.tools')}</h2>
      <div class="grid-2">
        {tools.map((tool) => (
          <a key={tool.path} class="hazard tool" href={href(tool.path)}>
            <Icon name={tool.icon} size={26} />
            <span>{t(tool.key)}</span>
          </a>
        ))}
      </div>

      <ReadyCard />

      {!settings.phoneSetupDone && (
        <a class="banner" href={href('setup')}>
          <strong>{t('setup.title')}</strong>
          <span>{t('setup.cta')}</span>
        </a>
      )}

      {drillDue && (
        <a class="banner" href={href('drill')}>
          <strong>{settings.lastDrillAt ? t('drill.due') : t('drill.first')}</strong>
          <span>{t('drill.cta')}</span>
        </a>
      )}
    </Screen>
  );
}
