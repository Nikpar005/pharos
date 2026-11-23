import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon';
import { href } from '../router';
import { useStore } from '../store';

export function Screen(props: { children: ComponentChildren; tab?: Tab; footer?: ComponentChildren }) {
  return (
    <div class="screen">
      <main class="screen-body">{props.children}</main>
      {props.footer && <div class="screen-footer no-print">{props.footer}</div>}
      {props.tab && <TabBar active={props.tab} />}
    </div>
  );
}

export function BackLink(props: { to?: string }) {
  const { t } = useStore();
  return (
    <a class="back no-print" href={href(props.to ?? '')}>
      <Icon name="back" size={22} stroke={2.2} />
      <span>{t('back')}</span>
    </a>
  );
}

export function DraftBanner() {
  const { t } = useStore();
  return (
    <p class="draft" role="note">
      {t('draft.banner')}
    </p>
  );
}

export function SectionTitle(props: { children: ComponentChildren }) {
  return <h2 class="section-title">{props.children}</h2>;
}

export function CallButton(props: { compact?: boolean }) {
  const { t, country } = useStore();
  if (props.compact) {
    return (
      <a class="btn btn-danger" href={`tel:${country.emergency}`}>
        <Icon name="phone" size={22} />
        <span>{t('home.call')}</span>
      </a>
    );
  }
  return (
    <a class="big-action big-danger" href={`tel:${country.emergency}`}>
      <span class="big-icon">
        <Icon name="phone" size={28} />
      </span>
      <span class="big-text">
        <span class="big-title">{t('home.call')}</span>
        <span class="big-sub">{t('home.callSub')}</span>
      </span>
    </a>
  );
}

type Tab = 'home' | 'guides' | 'kit' | 'plan';
const tabs: { id: Tab; icon: IconName; path: string }[] = [
  { id: 'home', icon: 'home', path: '' },
  { id: 'guides', icon: 'book', path: 'guides' },
  { id: 'kit', icon: 'kit', path: 'kit' },
  { id: 'plan', icon: 'users', path: 'plan' }
];

function TabBar(props: { active: Tab }) {
  const { t } = useStore();
  return (
    <nav class="tabbar no-print" aria-label={t('nav.label')}>
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={href(tab.path)}
          class={tab.id === props.active ? 'tab active' : 'tab'}
          aria-current={tab.id === props.active ? 'page' : undefined}
        >
          <Icon name={tab.icon} />
          <span>{t(`nav.${tab.id}`)}</span>
        </a>
      ))}
    </nav>
  );
}
