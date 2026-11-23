import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { fetchQuakes, type Quake } from '../lib/quakes';
import { distance, formatDistance } from '../lib/geo';

export function Quakes() {
  const { t, lang, plan } = useStore();
  const [state, setState] = useState<'loading' | 'ok' | 'offline' | 'error'>('loading');
  const [list, setList] = useState<Quake[]>([]);
  const home = plan.near.coords;

  const load = () => {
    if (!navigator.onLine) return setState('offline');
    setState('loading');
    fetchQuakes()
      .then((q) => {
        setList(q);
        setState('ok');
      })
      .catch(() => setState(navigator.onLine ? 'error' : 'offline'));
  };
  useEffect(load, []);

  const rel = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const ago = (d: Date) => {
    const min = Math.round((d.getTime() - Date.now()) / 60000);
    return Math.abs(min) < 60 ? rel.format(min, 'minute') : rel.format(Math.round(min / 60), 'hour');
  };

  return (
    <Screen tab="guides">
      <BackLink to="guides" />
      <h1 class="title-l">{t('quakes.title')}</h1>
      <p class="draft" role="note">
        {t('quakes.notOfficial')}
      </p>

      {state === 'loading' && <p class="muted">{t('quakes.loading')}</p>}
      {state === 'offline' && <p class="alert">{t('quakes.offline')}</p>}
      {state === 'error' && <p class="alert">{t('quakes.error')}</p>}
      {state === 'ok' && list.length === 0 && <p class="muted">{t('quakes.none')}</p>}

      {list.length > 0 && (
        <div class="list">
          {list.map((q) => (
            <div key={q.id} class="list-row">
              <span class={q.mag >= 4.5 ? 'mag high' : q.mag >= 3.5 ? 'mag mid' : 'mag'}>{q.mag.toFixed(1)}</span>
              <span class="list-main">
                <span class="list-title">{q.place}</span>
                <span class="list-sub">
                  {ago(q.time)} · {t('quakes.depth', { km: Math.round(q.depthKm) })}
                  {home && ` · ${t('quakes.fromHome', { d: formatDistance(distance(home, q), lang) })}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <button class="btn btn-ghost" onClick={load}>
        {t('quakes.refresh')}
      </button>
      <p class="fineprint">{t('quakes.credit')}</p>
    </Screen>
  );
}
