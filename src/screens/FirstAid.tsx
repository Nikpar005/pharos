import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, BackLink, CallButton, DraftBanner, SectionTitle } from '../components/ui';
import { pick } from '../content';
import { href } from '../router';
import { NotFound } from './NotFound';

type Loc<T> = Record<string, T>;
interface Topic {
  id: string;
  urgent: boolean;
  locales: Loc<{ title: string; signs: string; steps: string[] }>;
}
interface FirstAidData {
  status: 'draft' | 'reviewed';
  last_reviewed?: string;
  sources: { name: string; url: string }[];
  topics: Topic[];
}

// The first-aid text (~25 KB) is a separate file, fetched only when this
// screen opens. It is still precached, so it works offline.
let cache: Promise<FirstAidData> | null = null;
function useFirstAid(): FirstAidData | null {
  const [data, setData] = useState<FirstAidData | null>(null);
  useEffect(() => {
    cache ??= import('../generated/firstaid.json').then((m) => m.default as unknown as FirstAidData);
    cache.then(setData);
  }, []);
  return data;
}

function Source(props: { data: FirstAidData }) {
  const { t } = useStore();
  return (
    <div class="sources">
      <span>{t('firstaid.sourceNote')}</span>
      {props.data.sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
          {s.name} <Icon name="external" size={14} />
        </a>
      ))}
    </div>
  );
}

export function FirstAidList() {
  const { t, lang } = useStore();
  const data = useFirstAid();
  return (
    <Screen footer={<CallButton compact />}>
      <BackLink />
      <h1 class="title-l">{t('firstaid.title')}</h1>
      <p class="muted">{t('firstaid.sub')}</p>
      {data?.status === 'draft' && <DraftBanner />}

      <a class="list-row cpr-row" href={href('cpr')}>
        <span class="badge-icon danger">
          <Icon name="heart" size={22} />
        </span>
        <span class="list-main">
          <span class="list-title">{t('tools.cpr')}</span>
          <span class="list-sub">{t('firstaid.cprSub')}</span>
        </span>
      </a>

      {data && (
        <>
          <SectionTitle>{t('firstaid.all')}</SectionTitle>
          <div class="list">
            {data.topics.map((topic) => {
              const text = pick(topic.locales, lang);
              return (
                <a key={topic.id} class="list-row" href={href(`firstaid/${topic.id}`)}>
                  <span class="list-main">
                    <span class="list-title">
                      {text.title}
                      {topic.urgent && <span class="tag">{t('firstaid.urgent')}</span>}
                    </span>
                    <span class="list-sub clamp">{text.signs}</span>
                  </span>
                </a>
              );
            })}
          </div>
          <Source data={data} />
        </>
      )}
    </Screen>
  );
}

export function FirstAidTopic(props: { id: string }) {
  const { t, lang } = useStore();
  const data = useFirstAid();
  if (!data) return <Screen>{null}</Screen>;
  const topic = data.topics.find((x) => x.id === props.id);
  if (!topic) return <NotFound />;
  const text = pick(topic.locales, lang);

  return (
    <Screen footer={<CallButton compact />}>
      <BackLink to="firstaid" />
      <h1 class="title-l">{text.title}</h1>
      {data.status === 'draft' && <DraftBanner />}
      {topic.urgent && (
        <p class="banner banner-urgent" role="note">
          {t('firstaid.callFirst')}
        </p>
      )}
      <SectionTitle>{t('firstaid.signs')}</SectionTitle>
      <p class="lead">{text.signs}</p>
      <SectionTitle>{t('firstaid.what')}</SectionTitle>
      <ol class="steps">
        {text.steps.map((s, i) => (
          <li key={i}>
            <span class="step-n">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <Source data={data} />
    </Screen>
  );
}
