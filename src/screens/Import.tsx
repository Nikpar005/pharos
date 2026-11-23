import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { decodePlan, type Plan } from '../lib/plan';
import { navigate } from '../router';

export function Import(props: { data: string }) {
  const { t, setPlan } = useStore();
  const [incoming, setIncoming] = useState<Plan | null | undefined>(undefined);

  useEffect(() => {
    decodePlan(props.data).then(setIncoming);
  }, [props.data]);

  return (
    <Screen tab="plan">
      <BackLink />
      <h1 class="title-l">{t('import.title')}</h1>
      {incoming === null && (
        <p class="alert" role="alert">
          {t('import.bad')}
        </p>
      )}
      {incoming && (
        <>
          <p class="muted">{t('import.sub')}</p>
          <div class="card stack">
            {incoming.near.label && (
              <p>
                <strong>{t('plan.near')}:</strong> {incoming.near.label}
              </p>
            )}
            {incoming.far.label && (
              <p>
                <strong>{t('plan.far')}:</strong> {incoming.far.label}
              </p>
            )}
            {incoming.contacts.length > 0 && (
              <p>
                <strong>{t('ok.to')}:</strong> {incoming.contacts.map((c) => c.name || c.phone).join(', ')}
              </p>
            )}
            {incoming.members.length > 0 && (
              <p>
                <strong>{t('plan.members')}:</strong> {incoming.members.map((m) => m.name).join(', ')}
              </p>
            )}
          </div>
          <button
            class="btn btn-primary"
            onClick={() => {
              setPlan(incoming);
              navigate('plan');
            }}
          >
            {t('import.replace')}
          </button>
        </>
      )}
    </Screen>
  );
}
