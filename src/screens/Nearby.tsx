import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon, type IconName } from '../components/Icon';
import { Screen, BackLink, SectionTitle } from '../components/ui';
import { useLocate } from '../hooks';
import { getAllPois } from '../lib/maps';
import { CATEGORIES, nearest, type Category, type Place, type PoiFile } from '../lib/pois';
import { distance, formatDistance, geoUri } from '../lib/geo';
import { pick } from '../content';
import { href } from '../router';
import type { Key } from '../i18n';

const ICON: Record<Category, IconName> = {
  assembly: 'pin',
  hospital: 'firstaid',
  pharmacy: 'plusCircle',
  police: 'shield',
  fire: 'wildfire'
};

/**
 * One button: the closest shelters, hospitals, pharmacies, police and fire
 * stations, from data downloaded with the offline map. Online-only extras
 * (pharmacies on duty, official shelter map) are links below.
 */
export function Nearby() {
  const { t, lang, plan, country } = useStore();
  const [files, setFiles] = useState<PoiFile[] | null>(null);
  const [loc, locate] = useLocate();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    getAllPois().then(setFiles);
    locate();
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);

  const here = loc.status === 'ok' ? loc.coords : null;
  const result = here && files && files.length ? nearest(files, here, 3) : null;

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('nearby.title')}</h1>

      {loc.status === 'locating' && <p class="muted">{t('ok.locating')}</p>}
      {loc.status === 'error' && (
        <p class="alert" role="alert">
          {t(`geo.${loc.error}`)}
        </p>
      )}

      {(['near', 'far'] as const).some((w) => plan[w].coords) && (
        <>
          <SectionTitle>{t('plan.points')}</SectionTitle>
          <div class="list">
            {(['near', 'far'] as const)
              .filter((w) => plan[w].coords)
              .map((w) => (
                <a key={w} class="list-row" href={href(`go/${w}`)}>
                  <span class="badge-icon beacon">
                    <Icon name="pin" size={22} />
                  </span>
                  <span class="list-main">
                    <span class="list-title">{plan[w].label || t(w === 'near' ? 'plan.near' : 'plan.far')}</span>
                    {here && <span class="list-sub">{formatDistance(distance(here, plan[w].coords!), lang)}</span>}
                  </span>
                </a>
              ))}
          </div>
        </>
      )}

      {files && files.length === 0 && (
        <div class="empty">
          <p>{t('nearby.noData')}</p>
          <a class="btn btn-outline" href={href('map')}>
            {t('nearby.getMap')}
          </a>
        </div>
      )}

      {result &&
        CATEGORIES.map((c) => (
          <section key={c}>
            <SectionTitle>{t(`nearby.cat.${c}` as Key)}</SectionTitle>
            {result[c].length === 0 ? (
              <p class="muted small">{c === 'assembly' ? t('nearby.noAssembly') : t('nearby.none')}</p>
            ) : (
              <div class="list">
                {result[c].map((pl, i) => (
                  <PlaceRow key={i} place={pl} icon={ICON[c]} />
                ))}
              </div>
            )}
          </section>
        ))}

      <SectionTitle>{t('nearby.online')}</SectionTitle>
      {!online && <p class="muted small">{t('nearby.offlineLinks')}</p>}
      <div class="list">
        {country.links.map((l) => (
          <a key={l.id} class="list-row" href={l.url} target="_blank" rel="noopener noreferrer" aria-disabled={!online}>
            <span class="list-main">
              <span class="list-title">{pick(l.locales, lang).label}</span>
            </span>
            <Icon name="external" size={18} />
          </a>
        ))}
      </div>
      <p class="fineprint">{t('nearby.credit')}</p>
    </Screen>
  );
}

function PlaceRow(props: { place: Place; icon: IconName }) {
  const { t, lang } = useStore();
  const { place } = props;
  return (
    <div class="list-row">
      <span class="badge-icon">
        <Icon name={props.icon} size={22} />
      </span>
      <span class="list-main grow">
        <span class="list-title">{place.name || t(`nearby.cat.${place.category}` as Key)}</span>
        <span class="list-sub">{formatDistance(place.meters, lang)}</span>
      </span>
      <span class="row-actions">
        {place.phone && (
          <a class="icon-btn" href={`tel:${place.phone.replace(/\s/g, '')}`} aria-label={`${t('nearby.call')} ${place.name}`}>
            <Icon name="phone" size={20} />
          </a>
        )}
        <a class="icon-btn" href={geoUri(place.coords, place.name)} aria-label={`${t('nearby.navigate')} ${place.name}`}>
          <Icon name="arrowUp" size={20} />
        </a>
      </span>
    </div>
  );
}
