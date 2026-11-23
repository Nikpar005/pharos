import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { regions, pick } from '../content';
import { deleteRegion, downloadRegion, formatMB, listDownloaded, remoteSize, type MapMeta } from '../lib/maps';
import { href } from '../router';

/** Download manager for offline maps. The map itself lives in MapView (lazy). */
export function Maps() {
  const { t, lang } = useStore();
  const [have, setHave] = useState<Record<string, MapMeta>>({});
  const [sizes, setSizes] = useState<Record<string, number | null>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const refresh = () => listDownloaded().then((list) => setHave(Object.fromEntries(list.map((m) => [m.id, m]))));

  useEffect(() => {
    refresh();
    regions.forEach((r) => remoteSize(r.id).then((s) => setSizes((prev) => ({ ...prev, [r.id]: s }))));
    return () => abort.current?.abort();
  }, []);

  const download = async (id: string) => {
    setFailed(null);
    abort.current = new AbortController();
    setProgress((p) => ({ ...p, [id]: 0 }));
    try {
      await downloadRegion(id, (v) => setProgress((p) => ({ ...p, [id]: v })), abort.current.signal);
      // Fetch the map screen's code now, while online, so it is cached for offline use.
      const mod = await import('./MapView').catch(() => null);
      if (mod) await fetch(mod.workerUrl).catch(() => undefined);
      await refresh();
    } catch {
      setFailed(id);
    } finally {
      setProgress(({ [id]: _, ...rest }) => rest);
    }
  };

  const total = Object.values(have).reduce((s, m) => s + m.bytes, 0);

  return (
    <Screen tab="guides">
      <BackLink to="guides" />
      <h1 class="title-l">{t('map.title')}</h1>
      <p class="muted">{t('map.sub')}</p>

      <div class="list">
        {regions.map((r) => {
          const meta = have[r.id];
          const p = progress[r.id];
          const size = sizes[r.id];
          return (
            <div key={r.id} class="list-row map-row">
              <span class="list-main grow">
                <span class="list-title">{pick(r.locales, lang).name}</span>
                <span class="list-sub">
                  {meta
                    ? `${t('map.saved')} · ${formatMB(meta.bytes, lang)}`
                    : p !== undefined
                      ? p < 0
                        ? t('map.downloading')
                        : `${t('map.downloading')} ${Math.round(p * 100)}%`
                      : size
                        ? formatMB(size, lang)
                        : size === null
                          ? t('map.unavailable')
                          : '…'}
                </span>
                {p !== undefined && p >= 0 && (
                  <span class="mini-progress">
                    <span style={{ width: `${p * 100}%` }} />
                  </span>
                )}
                {failed === r.id && <span class="list-sub error-text">{t('map.failed')}</span>}
              </span>
              {meta ? (
                <span class="row-actions">
                  <a class="btn btn-small btn-primary" href={href(`map/${r.id}`)}>
                    {t('map.open')}
                  </a>
                  <button
                    class="btn btn-small btn-ghost"
                    onClick={() => deleteRegion(r.id).then(refresh)}
                    aria-label={`${t('remove')} ${pick(r.locales, lang).name}`}
                  >
                    {t('remove')}
                  </button>
                </span>
              ) : p !== undefined ? (
                <button class="btn btn-small btn-ghost" onClick={() => abort.current?.abort()}>
                  {t('cancel')}
                </button>
              ) : (
                <button class="btn btn-small btn-outline" disabled={!size} onClick={() => download(r.id)}>
                  {t('map.download')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {total > 0 && <p class="fineprint">{t('map.used', { size: formatMB(total, lang) })}</p>}
      <p class="fineprint">{t('map.wifiHint')}</p>
      <p class="fineprint">{t('map.attribution')}</p>
    </Screen>
  );
}
