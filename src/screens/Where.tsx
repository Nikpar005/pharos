import { useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, CallButton } from '../components/ui';
import { useLocate } from '../hooks';
import { formatCoords, formatDistance, geoUri } from '../lib/geo';

/** Big, readable coordinates to tell the 112 operator where you are. */
export function Where() {
  const { t, lang } = useStore();
  const [loc, locate] = useLocate();
  const [copied, setCopied] = useState(false);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{t('where.title')}</h1>
      <p class="muted">{t('where.sub')}</p>

      {loc.status === 'ok' ? (
        <div class="coords-card">
          <span class="coords" aria-live="polite">
            {formatCoords(loc.coords)}
          </span>
          {loc.coords.accuracy !== undefined && (
            <span class="muted">{t('where.accuracy', { m: formatDistance(loc.coords.accuracy, lang) })}</span>
          )}
          <div class="row-2">
            <button
              class="btn btn-outline"
              onClick={() => {
                navigator.clipboard?.writeText(formatCoords(loc.coords)).then(() => setCopied(true), () => undefined);
              }}
            >
              {copied ? t('where.copied') : t('where.copy')}
            </button>
            <a class="btn btn-outline" href={geoUri(loc.coords)}>
              {t('where.openMaps')}
            </a>
          </div>
        </div>
      ) : (
        <button class="btn btn-primary" onClick={locate} disabled={loc.status === 'locating'}>
          <Icon name="crosshair" size={22} />
          <span>{loc.status === 'locating' ? t('ok.locating') : t('where.get')}</span>
        </button>
      )}

      {loc.status === 'error' && (
        <p class="alert" role="alert">
          {t(`geo.${loc.error}`)}
        </p>
      )}
      {loc.status === 'ok' && (
        <button class="btn btn-ghost" onClick={locate}>
          {t('where.again')}
        </button>
      )}
      <p class="fineprint">{t('where.gpsHint')}</p>
    </Screen>
  );
}
