import { useStore } from '../store';
import { Screen, DraftBanner, SectionTitle } from '../components/ui';
import { kit, kitItemIds, pick } from '../content';

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;

export function Kit() {
  const { t, lang, kit: state, setKit } = useStore();
  const done = kitItemIds.filter((id) => state.checked[id]).length;
  const total = kitItemIds.length;
  const reviewed = state.reviewedAt ? new Date(state.reviewedAt) : null;
  const due = !reviewed || Date.now() - reviewed.getTime() > SIX_MONTHS_MS;
  const today = () => new Date().toISOString().slice(0, 10);

  return (
    <Screen tab="kit">
      <h1 class="title-l">{t('kit.title')}</h1>
      {kit.status === 'draft' && <DraftBanner />}

      <div class="progress-card">
        <div class="progress-head">
          <span>{t('kit.progress')}</span>
          <strong>{t('kit.count', { done, total })}</strong>
        </div>
        <div
          class="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={t('kit.progress')}
        >
          <div class="progress-bar" style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <span class="progress-note">
          {due && reviewed
            ? t('kit.reviewDue')
            : t('kit.review', { date: reviewed ? reviewed.toLocaleDateString(lang) : t('kit.never') })}
        </span>
        <button class="btn btn-small" onClick={() => setKit({ ...state, reviewedAt: today() })}>
          {t('kit.markReviewed')}
        </button>
      </div>

      {kit.groups.map((g) => (
        <section key={g.id}>
          <SectionTitle>{pick(g.locales, lang).title}</SectionTitle>
          <div class="list">
            {g.items.map((item) => (
              <label key={item.id} class={state.checked[item.id] ? 'list-row check-row done' : 'list-row check-row'}>
                <input
                  type="checkbox"
                  checked={!!state.checked[item.id]}
                  onChange={(e) =>
                    setKit({
                      checked: { ...state.checked, [item.id]: e.currentTarget.checked },
                      reviewedAt: today()
                    })
                  }
                />
                <span class="list-title">{pick(item.locales, lang).label}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </Screen>
  );
}
