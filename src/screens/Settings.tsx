import { useStore } from '../store';
import { Screen, BackLink, SectionTitle } from '../components/ui';
import { triggerGuardian } from '../components/Guardian';
import { countries, pick } from '../content';
import { languages, type Lang } from '../i18n';
import type { Theme } from '../lib/storage';
import { href } from '../router';

export function Settings() {
  const { t, lang, settings, setSettings } = useStore();
  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('settings.title')}</h1>

      <div class="field">
        <label for="s-lang">{t('welcome.language')}</label>
        <select id="s-lang" value={lang} onChange={(e) => setSettings({ lang: e.currentTarget.value as Lang })}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div class="field">
        <label for="s-country">{t('welcome.country')}</label>
        <select id="s-country" value={settings.country} onChange={(e) => setSettings({ country: e.currentTarget.value })}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {pick(c.locales, lang).name}
            </option>
          ))}
        </select>
      </div>
      <div class="field">
        <label for="s-theme">{t('settings.night')}</label>
        <select id="s-theme" value={settings.theme} onChange={(e) => setSettings({ theme: e.currentTarget.value as Theme })}>
          <option value="auto">{t('settings.theme.auto')}</option>
          <option value="light">{t('settings.theme.light')}</option>
          <option value="night">{t('settings.theme.night')}</option>
        </select>
      </div>

      <SectionTitle>{t('settings.access')}</SectionTitle>
      <label class="toggle-row">
        <span class="toggle-label">{t('settings.largeText')}</span>
        <input type="checkbox" checked={settings.largeText} onChange={(e) => setSettings({ largeText: e.currentTarget.checked })} />
      </label>
      <label class="toggle-row">
        <span class="toggle-label">{t('cpr.voice')}</span>
        <input type="checkbox" checked={settings.voice} onChange={(e) => setSettings({ voice: e.currentTarget.checked })} />
      </label>
      <label class="toggle-row">
        <span class="toggle-label">{t('simple.title')}</span>
        <input type="checkbox" checked={settings.simpleMode} onChange={(e) => setSettings({ simpleMode: e.currentTarget.checked })} />
      </label>

      <SectionTitle>{t('guardian.settingsTitle')}</SectionTitle>
      <div class="card stack">
        <p>{t('guardian.explain')}</p>
        <label class="toggle-row flat">
          <span class="toggle-label">{t('guardian.enable')}</span>
          <input type="checkbox" checked={settings.guardian} onChange={(e) => setSettings({ guardian: e.currentTarget.checked })} />
        </label>
        <button class="btn btn-outline" onClick={() => triggerGuardian(true)}>
          {t('guardian.tryIt')}
        </button>
        <p class="fineprint">{t('guardian.limits')}</p>
      </div>

      <SectionTitle>{t('settings.more')}</SectionTitle>
      <div class="list">
        <a class="list-row" href={href('setup')}>
          <span class="list-title">{t('setup.title')}</span>
        </a>
        <a class="list-row" href={href('battery')}>
          <span class="list-title">{t('battery.title')}</span>
        </a>
        <a class="list-row" href={href('welcome')}>
          <span class="list-title">{t('settings.about')}</span>
        </a>
      </div>
    </Screen>
  );
}
