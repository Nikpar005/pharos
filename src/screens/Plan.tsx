import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Screen, SectionTitle } from '../components/ui';
import { useLocate } from '../hooks';
import { newId, type Contact, type MeetingPoint, type Member, type Plan as PlanT } from '../lib/plan';
import { formatCoords } from '../lib/geo';
import { href } from '../router';

interface PickedContact {
  name?: string[];
  tel?: string[];
}
type ContactsApi = { select: (props: string[], opts: { multiple: boolean }) => Promise<PickedContact[]> };
const contactsApi = (navigator as unknown as { contacts?: ContactsApi }).contacts;

export function Plan() {
  const { t, plan, setPlan } = useStore();
  const update = (patch: Partial<PlanT>) => setPlan({ ...plan, ...patch });

  const updateContact = (id: string, patch: Partial<Contact>) =>
    update({ contacts: plan.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const updateMember = (id: string, patch: Partial<Member>) =>
    update({ members: plan.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  // Android Chrome can open the phone's contact list; elsewhere we type them in.
  const pickContacts = async () => {
    if (!contactsApi) return;
    try {
      const picked = await contactsApi.select(['name', 'tel'], { multiple: true });
      const added = picked
        .filter((p) => p.tel?.[0])
        .map((p) => ({ id: newId(), name: p.name?.[0] ?? '', phone: p.tel![0]!, checkIn: true }));
      update({ contacts: [...plan.contacts, ...added].slice(0, 20) });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Screen tab="plan">
      <h1 class="title-l">{t('plan.title')}</h1>
      <p class="muted small">
        <Icon name="lock" size={14} stroke={2.2} /> {t('plan.local')}
      </p>

      <SectionTitle>{t('plan.points')}</SectionTitle>
      <PointEditor which="near" title={t('plan.near')} point={plan.near} onChange={(near) => update({ near })} />
      <PointEditor which="far" title={t('plan.far')} point={plan.far} onChange={(far) => update({ far })} />

      <SectionTitle>{t('plan.outOfArea')}</SectionTitle>
      <div class="card stack">
        <input
          aria-label={t('plan.name')}
          placeholder={t('plan.name')}
          value={plan.outOfArea.name}
          onChange={(e) => update({ outOfArea: { ...plan.outOfArea, name: e.currentTarget.value } })}
        />
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-label={t('plan.phone')}
          placeholder={t('plan.phone')}
          value={plan.outOfArea.phone}
          onChange={(e) => update({ outOfArea: { ...plan.outOfArea, phone: e.currentTarget.value } })}
        />
        <p class="fineprint">{t('plan.outOfAreaHint')}</p>
      </div>

      <SectionTitle>{t('plan.contacts')}</SectionTitle>
      {plan.contacts.map((c) => (
        <div key={c.id} class="card row-edit">
          <div class="stack grow">
            <input
              aria-label={t('plan.name')}
              placeholder={t('plan.name')}
              value={c.name}
              onChange={(e) => updateContact(c.id, { name: e.currentTarget.value })}
            />
            <input
              type="tel"
              inputMode="tel"
              aria-label={t('plan.phone')}
              placeholder={t('plan.phone')}
              value={c.phone}
              onChange={(e) => updateContact(c.id, { phone: e.currentTarget.value })}
            />
          </div>
          <button
            class="icon-btn"
            aria-label={`${t('remove')} ${c.name}`}
            onClick={() => update({ contacts: plan.contacts.filter((x) => x.id !== c.id) })}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
      ))}
      <div class="row-2">
        {contactsApi && (
          <button class="btn btn-outline" onClick={pickContacts}>
            {t('plan.pickContacts')}
          </button>
        )}
        <button
          class="btn btn-dashed"
          onClick={() => update({ contacts: [...plan.contacts, { id: newId(), name: '', phone: '', checkIn: true }] })}
        >
          {t('plan.addContact')}
        </button>
      </div>

      <SectionTitle>{t('plan.members')}</SectionTitle>
      {plan.members.map((m) => (
        <div key={m.id} class="card row-edit">
          <div class="stack grow">
            <input
              aria-label={t('plan.name')}
              placeholder={t('plan.name')}
              value={m.name}
              onChange={(e) => updateMember(m.id, { name: e.currentTarget.value })}
            />
            <textarea
              rows={2}
              aria-label={t('plan.needsPlaceholder')}
              placeholder={t('plan.needsPlaceholder')}
              value={m.needs}
              onChange={(e) => updateMember(m.id, { needs: e.currentTarget.value })}
            />
          </div>
          <button
            class="icon-btn"
            aria-label={`${t('remove')} ${m.name}`}
            onClick={() => update({ members: plan.members.filter((x) => x.id !== m.id) })}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
      ))}
      <button
        class="btn btn-dashed no-print"
        onClick={() => update({ members: [...plan.members, { id: newId(), name: '', needs: '' }] })}
      >
        {t('plan.addMember')}
      </button>

      <div class="row-2 no-print">
        <button class="btn btn-primary" onClick={() => window.print()}>
          <Icon name="printer" size={20} />
          <span>{t('plan.print')}</span>
        </button>
        <a class="btn btn-outline" href={href('plan/share')}>
          <Icon name="qr" size={20} />
          <span>{t('plan.share')}</span>
        </a>
      </div>
    </Screen>
  );
}

function PointEditor(props: {
  which: 'near' | 'far';
  title: string;
  point: MeetingPoint;
  onChange: (p: MeetingPoint) => void;
}) {
  const { t } = useStore();
  const [loc, locate] = useLocate();
  const { point } = props;

  return (
    <div class="card stack">
      <label class="field-label" for={`point-${props.which}`}>
        {props.title}
      </label>
      <input
        id={`point-${props.which}`}
        placeholder={t('plan.pointPlaceholder')}
        value={point.label}
        onChange={(e) => props.onChange({ ...point, label: e.currentTarget.value })}
      />
      {point.coords && (
        <span class="muted small">
          <Icon name="pin" size={14} /> {formatCoords(point.coords)}
        </span>
      )}
      <div class="row-2 no-print">
        <button
          class="btn btn-small btn-outline"
          disabled={loc.status === 'locating'}
          onClick={async () => {
            const c = await locate();
            if (c) props.onChange({ ...point, coords: { lat: c.lat, lon: c.lon } });
          }}
        >
          {loc.status === 'locating' ? t('ok.locating') : t('plan.useHere')}
        </button>
        {point.coords && (
          <a class="btn btn-small btn-primary" href={href(`go/${props.which}`)}>
            {t('plan.go')}
          </a>
        )}
      </div>
      {loc.status === 'error' && (
        <p class="alert" role="alert">
          {t(`geo.${loc.error}`)}
        </p>
      )}
    </div>
  );
}
