import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink } from '../components/ui';
import { useHeading, useWatchPosition } from '../hooks';
import { bearing, compassPoint, distance, formatDistance, geoUri } from '../lib/geo';
import type { Key } from '../i18n';

/**
 * Offline "map": distance and an arrow to the meeting point. Needs only GPS
 * and the compass, no map tiles, so it works with zero data and costs far
 * less battery than a map view.
 */
export function Go(props: { which: 'near' | 'far' }) {
  const { t, lang, plan } = useStore();
  const point = plan[props.which];
  const target = point.coords;
  const pos = useWatchPosition(!!target);
  const { heading, needsPermission, request } = useHeading();
  const label = point.label || t(props.which === 'near' ? 'plan.near' : 'plan.far');

  if (!target) {
    return (
      <Screen tab="plan">
        <BackLink to="plan" />
        <h1 class="title-l">{t('go.title', { label })}</h1>
        <p class="alert">{t('go.noPoint')}</p>
      </Screen>
    );
  }

  const here = pos.status === 'ok' ? pos.coords : null;
  const dist = here ? distance(here, target) : null;
  const brg = here ? bearing(here, target) : null;
  // With a compass the arrow points the real way; without one it is relative to north.
  const rotation = brg === null ? 0 : heading === null ? brg : brg - heading;
  const arrived = dist !== null && dist < Math.max(30, here?.accuracy ?? 0);

  return (
    <Screen tab="plan">
      <BackLink to="plan" />
      <h1 class="title-l">{t('go.title', { label })}</h1>

      <div class="compass" aria-hidden="true">
        <div class="compass-arrow" style={{ transform: `rotate(${rotation}deg)` }}>
          <Icon name="arrowUp" size={120} stroke={2.4} />
        </div>
      </div>

      {pos.status === 'locating' && <p class="center muted">{t('ok.locating')}</p>}
      {pos.status === 'error' && (
        <p class="alert" role="alert">
          {t(`geo.${pos.error}`)}
        </p>
      )}

      {dist !== null && brg !== null && (
        <div class="stats" aria-live="polite">
          {arrived ? (
            <p class="title-s center">{t('go.arrived')}</p>
          ) : (
            <>
              <div>
                <span class="stat-label">{t('go.distance')}</span>
                <span class="stat-value">{formatDistance(dist, lang)}</span>
              </div>
              <div>
                <span class="stat-label">{t('go.direction')}</span>
                <span class="stat-value">{t(`go.dir.${compassPoint(brg)}` as Key)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {needsPermission && (
        <button class="btn btn-outline" onClick={request}>
          {t('go.enableCompass')}
        </button>
      )}
      {!needsPermission && heading === null && here && <p class="fineprint">{t('go.noCompass')}</p>}

      <a class="btn btn-ghost" href={geoUri(target, label)}>
        {t('go.openMaps')}
      </a>
    </Screen>
  );
}
