import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { encodePlan, shareUrl } from '../lib/plan';

// A version-40 QR code holds ~2.9 KB, but phones scan small codes far more
// reliably. Above this length we show the link only.
const QR_MAX_CHARS = 1200;

export function Share() {
  const { t, plan } = useStore();
  const [url, setUrl] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    encodePlan(plan).then(async (data) => {
      const link = shareUrl(location.origin, import.meta.env.BASE_URL, data);
      if (!alive) return;
      setUrl(link);
      if (link.length <= QR_MAX_CHARS) {
        // The QR library loads only on this screen, so it never slows down app start.
        const { renderSVG } = await import('uqr');
        if (alive) setSvg(renderSVG(link, { ecc: 'L', border: 2 }));
      }
    });
    return () => {
      alive = false;
    };
  }, [plan]);

  const canShare = typeof navigator.share === 'function';

  return (
    <Screen tab="plan">
      <BackLink to="plan" />
      <h1 class="title-l">{t('share.title')}</h1>
      <p class="muted">{t('share.sub')}</p>

      {svg ? (
        <div class="qr" role="img" aria-label="QR" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        url && <p class="alert">{t('share.tooBig')}</p>
      )}

      {url && (
        <div class="row-2">
          {canShare && (
            <button class="btn btn-primary" onClick={() => navigator.share({ title: 'Pharos', url }).catch(() => undefined)}>
              {t('share.send')}
            </button>
          )}
          <button
            class="btn btn-outline"
            onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true), () => undefined)}
          >
            {copied ? t('where.copied') : t('share.copy')}
          </button>
        </div>
      )}
      <p class="fineprint">{t('share.privacy')}</p>
    </Screen>
  );
}
