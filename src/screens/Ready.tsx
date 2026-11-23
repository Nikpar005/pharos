import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink } from '../components/ui';
import { readiness } from '../lib/readiness';
import { listDownloaded } from '../lib/maps';
import { kitItemIds } from '../content';
import { href } from '../router';
import type { Key } from '../i18n';

export function useReadiness() {
  const { plan, kit, settings } = useStore();
  const [maps, setMaps] = useState(0);
  useEffect(() => {
    listDownloaded().then((l) => setMaps(l.length));
  }, []);
  return readiness({ plan, kit, kitTotal: kitItemIds.length, settings, mapsDownloaded: maps });
}

export function ReadyCard() {
  const { t } = useStore();
  const { score } = useReadiness();
  return (
    <a class="ready-card" href={href('ready')}>
      <span class="ready-ring" style={{ '--p': `${score}` } as Record<string, string>}>
        <span>{score}</span>
      </span>
      <span class="list-main">
        <span class="list-title">{t('ready.title')}</span>
        <span class="list-sub">{score >= 80 ? t('ready.great') : t('ready.next')}</span>
      </span>
    </a>
  );
}

export function Ready() {
  const { t } = useStore();
  const { score, items } = useReadiness();
  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('ready.title')}</h1>
      <div class="ready-big" aria-label={`${score} / 100`}>
        <span class="ready-ring big" style={{ '--p': `${score}` } as Record<string, string>}>
          <span>{score}</span>
        </span>
      </div>
      <p class="muted center">{t('ready.sub')}</p>
      <div class="list">
        {items.map((it) => (
          <a key={it.id} class={it.points >= it.max ? 'list-row done' : 'list-row'} href={href(it.path)}>
            <span class={it.points >= it.max ? 'badge-icon ok' : 'badge-icon'}>
              <Icon name={it.points >= it.max ? 'check' : 'list'} size={20} />
            </span>
            <span class="list-main grow">
              <span class="list-title">{t(`ready.item.${it.id}` as Key)}</span>
            </span>
            <span class="pts">
              {it.points}/{it.max}
            </span>
          </a>
        ))}
      </div>
    </Screen>
  );
}
