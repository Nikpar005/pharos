import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Screen, BackLink } from '../components/ui';
import { clearLog, clock, logEvent, readLog, type EventType, type LogEvent } from '../lib/eventlog';
import type { Key } from '../i18n';

const QUICK: EventType[] = ['call-112', 'aed-shock', 'aspirin', 'adrenaline', 'conscious'];

/** What happened and when, to show the ambulance crew. */
export function Log() {
  const { t, lang } = useStore();
  const [list, setList] = useState<LogEvent[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    readLog().then(setList);
  }, []);

  const add = async (type: EventType, text?: string) => setList(await logEvent(type, text));

  return (
    <Screen>
      <BackLink />
      <h1 class="title-l">{t('log.title')}</h1>
      <p class="muted">{t('log.sub')}</p>

      <div class="chip-grid">
        {QUICK.map((q) => (
          <button key={q} class="btn btn-small btn-outline" onClick={() => add(q)}>
            + {t(`log.type.${q}` as Key)}
          </button>
        ))}
      </div>
      <form
        class="row-edit"
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) add('note', note.trim()).then(() => setNote(''));
        }}
      >
        <input
          class="grow"
          aria-label={t('log.note')}
          placeholder={t('log.note')}
          value={note}
          onInput={(e) => setNote(e.currentTarget.value)}
        />
        <button class="btn btn-small btn-primary" type="submit">
          +
        </button>
      </form>

      {list.length === 0 ? (
        <p class="muted center">{t('log.empty')}</p>
      ) : (
        <ol class="timeline">
          {list
            .slice()
            .reverse()
            .map((ev, i) => (
              <li key={i}>
                <span class="time">{clock(ev.at, lang)}</span>
                <span>{ev.type === 'note' ? ev.note : t(`log.type.${ev.type}` as Key)}</span>
              </li>
            ))}
        </ol>
      )}

      {list.length > 0 && (
        <button
          class="btn btn-ghost"
          onClick={() => {
            if (confirmClear(t('log.confirmClear'))) clearLog().then(() => setList([]));
          }}
        >
          {t('log.clear')}
        </button>
      )}
    </Screen>
  );
}

// A native confirm is acceptable here: clearing the log is rare and destructive.
function confirmClear(msg: string): boolean {
  try {
    return window.confirm(msg);
  } catch {
    return false;
  }
}
