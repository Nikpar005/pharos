import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { languages, type Lang } from '../i18n';
import { countries, pick } from '../content';
import { useOfflineReady } from '../sw';
import { navigate } from '../router';

export function Welcome() {
  const { t, settings, setSettings, lang } = useStore();
  const offline = useOfflineReady();

  const points = [
    offline ? t('welcome.offlineReady') : t('welcome.offlinePending'),
    t('welcome.noAccount'),
    t('welcome.local'),
    t('welcome.open')
  ];

  return (
    <div class="welcome">
      <div class="welcome-hero">
        <div class="logo-xl">
          <Icon name="lighthouse" size={64} stroke={1.6} />
        </div>
        <h1>Pharos</h1>
        <p class="pre">{t('welcome.tagline')}</p>
      </div>

      <div class="stack">
        <div class="field">
          <label for="country">{t('welcome.country')}</label>
          <select id="country" value={settings.country} onChange={(e) => setSettings({ country: e.currentTarget.value })}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {pick(c.locales, lang).name}
              </option>
            ))}
          </select>
        </div>
        <div class="field">
          <label for="lang">{t('welcome.language')}</label>
          <select id="lang" value={lang} onChange={(e) => setSettings({ lang: e.currentTarget.value as Lang })}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul class="welcome-points">
        {points.map((p, i) => (
          <li key={i} class={i === 0 && !offline ? 'pending' : undefined}>
            <Icon name="check" size={22} stroke={2.2} />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div class="grow" />
      <button
        class="btn btn-beacon"
        onClick={() => {
          setSettings({ onboarded: true });
          // Stay on the screen the user came for (e.g. a plan they just imported).
          if (!location.hash || location.hash.includes('welcome')) navigate('');
        }}
      >
        {t('welcome.start')}
      </button>
      <p class="fineprint">{t('app.disclaimer')}</p>
    </div>
  );
}
