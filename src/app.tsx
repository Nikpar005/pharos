import { useEffect } from 'preact/hooks';
import { useStore } from './store';
import { useRoute } from './router';
import { Home } from './screens/Home';
import { GuideList, GuideDetail } from './screens/Guides';
import { ImOk } from './screens/ImOk';
import { Where } from './screens/Where';
import { NotFound } from './screens/NotFound';
import { Trapped, Cpr, Sos } from './screens/Tools';
import { lazyScreen } from './components/Lazy';
import { FirstAidList, FirstAidTopic } from './screens/FirstAid';
import { Lazy } from './components/Lazy';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Guardian } from './components/Guardian';

const loadMapView = () => import('./screens/MapView');

// Screens not needed in the first seconds of an emergency load on demand
// (still precached for offline use), keeping start-up small and fast.
const Welcome = lazyScreen(() => import('./screens/Welcome').then((m) => m.Welcome));
const Drill = lazyScreen(() => import('./screens/Drill').then((m) => m.Drill));
const Go = lazyScreen(() => import('./screens/Go').then((m) => m.Go));
const Kit = lazyScreen(() => import('./screens/Kit').then((m) => m.Kit));
const Plan = lazyScreen(() => import('./screens/Plan').then((m) => m.Plan));
const Share = lazyScreen(() => import('./screens/Share').then((m) => m.Share));
const Import = lazyScreen(() => import('./screens/Import').then((m) => m.Import));
const Maps = lazyScreen(() => import('./screens/Maps').then((m) => m.Maps));
const Battery = lazyScreen(() => import('./screens/Battery').then((m) => m.Battery));
const Quakes = lazyScreen(() => import('./screens/Quakes').then((m) => m.Quakes));
const Log = lazyScreen(() => import('./screens/Log').then((m) => m.Log));
const Nearby = lazyScreen(() => import('./screens/Nearby').then((m) => m.Nearby));
const Settings = lazyScreen(() => import('./screens/Settings').then((m) => m.Settings));
const Ready = lazyScreen(() => import('./screens/Ready').then((m) => m.Ready));
const PhoneSetup = lazyScreen(() => import('./screens/Extras').then((m) => m.PhoneSetup));
const Evacuate = lazyScreen(() => import('./screens/Extras').then((m) => m.Evacuate));
const Phrases = lazyScreen(() => import('./screens/Extras').then((m) => m.Phrases));

export function App() {
  return (
    <ErrorBoundary>
      <Routes />
      <Guardian />
    </ErrorBoundary>
  );
}

function Routes() {
  const { settings, lang, t } = useStore();
  const [page, a] = useRoute();

  useEffect(() => {
    document.documentElement.lang = lang;
    const root = document.documentElement;
    if (settings.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
    if (settings.largeText) root.dataset.size = 'large';
    else delete root.dataset.size;
  }, [lang, settings.theme, settings.largeText]);

  // An imported plan link must work even on a phone that never opened Pharos.
  if (page === 'import' && a) return <Import data={a} />;
  if (!settings.onboarded || page === 'welcome') return <Welcome />;

  switch (page) {
    case undefined:
      return <Home />;
    case 'guides':
      return a ? <GuideDetail id={a} /> : <GuideList />;
    case 'ok':
      return <ImOk />;
    case 'where':
      return <Where />;
    case 'go':
      return <Go which={a === 'far' ? 'far' : 'near'} />;
    case 'kit':
      return <Kit />;
    case 'plan':
      return a === 'share' ? <Share /> : <Plan />;
    case 'map':
      return a ? <Lazy load={loadMapView} props={{ id: a }} loading={t('map.loading')} error={t('map.openError')} /> : <Maps />;
    case 'battery':
      return <Battery />;
    case 'quakes':
      return <Quakes />;
    case 'trapped':
      return <Trapped />;
    case 'cpr':
      return <Cpr />;
    case 'firstaid':
      return a ? <FirstAidTopic id={a} /> : <FirstAidList />;
    case 'sos':
      return <Sos />;
    case 'drill':
      return <Drill />;
    case 'log':
      return <Log />;
    case 'nearby':
      return <Nearby />;
    case 'settings':
      return <Settings />;
    case 'ready':
      return <Ready />;
    case 'setup':
      return <PhoneSetup />;
    case 'evacuate':
      return <Evacuate />;
    case 'phrases':
      return <Phrases />;
    default:
      return <NotFound />;
  }
}
