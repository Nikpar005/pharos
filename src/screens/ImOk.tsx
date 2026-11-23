import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, SectionTitle } from '../components/ui';
import { buildSmsLink, detectPlatform } from '../lib/sms';
import { mapLink, formatCoords } from '../lib/geo';
import { useLocate } from '../hooks';
import { href } from '../router';

export function ImOk() {
  const { t, plan } = useStore();
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(plan.contacts.map((c) => [c.id, c.checkIn]))
  );
  const [withLocation, setWithLocation] = useState(false);
  const [loc, locate] = useLocate();

  const coords = loc.status === 'ok' ? loc.coords : null;
  const body = useMemo(() => {
    let text = t('ok.body');
    if (withLocation && coords) text += `\n${t('ok.bodyLocation', { link: `${formatCoords(coords)} ${mapLink(coords)}` })}`;
    return text;
  }, [t, withLocation, coords]);

  const chosen = plan.contacts.filter((c) => picked[c.id] && c.phone.trim());
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const link = chosen.length ? buildSmsLink(chosen.map((c) => c.phone), body, platform) : undefined;
  const label = chosen.length === 0 ? t('ok.send0') : chosen.length === 1 ? t('ok.send1') : t('ok.sendN', { n: chosen.length });

  return (
    <Screen
      footer={
        <>
          <a class={link ? 'btn btn-safe' : 'btn btn-safe disabled'} href={link} aria-disabled={!link}>
            <Icon name="message" size={22} />
            <span>{label}</span>
          </a>
          <p class="fineprint center">{t('ok.hint')}</p>
        </>
      }
    >
      <BackLink />
      <h1 class="title-l">{t('ok.title')}</h1>
      <p class="muted">{t('ok.sub')}</p>

      <SectionTitle>{t('ok.message')}</SectionTitle>
      <div class="bubble pre">
        {body}
        {withLocation && loc.status === 'locating' && <div class="bubble-note">{t('ok.locating')}</div>}
        {withLocation && loc.status === 'error' && <div class="bubble-note">{t(`geo.${loc.error}`)}</div>}
      </div>

      <label class="toggle-row">
        <span class="toggle-label">
          <Icon name="pin" size={22} />
          {t('ok.withLocation')}
        </span>
        <input
          type="checkbox"
          checked={withLocation}
          onChange={(e) => {
            const on = e.currentTarget.checked;
            setWithLocation(on);
            if (on && loc.status !== 'ok') locate();
          }}
        />
      </label>

      <SectionTitle>{t('ok.to')}</SectionTitle>
      {plan.contacts.length === 0 ? (
        <div class="empty">
          <p>{t('ok.noContacts')}</p>
          <a class="btn btn-outline" href={href('plan')}>
            {t('ok.addContacts')}
          </a>
        </div>
      ) : (
        <div class="list">
          {plan.contacts.map((c) => (
            <label key={c.id} class="list-row check-row">
              <input
                type="checkbox"
                checked={!!picked[c.id]}
                onChange={(e) => setPicked({ ...picked, [c.id]: e.currentTarget.checked })}
              />
              <span class="avatar">{(c.name.trim()[0] ?? '?').toUpperCase()}</span>
              <span class="list-main">
                <span class="list-title">{c.name || c.phone}</span>
                <span class="list-sub">{c.phone}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Screen>
  );
}
