import { useEffect } from 'preact/hooks';
import { useStore } from './store';
import { useRoute } from './router';
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { GuideList, GuideDetail } from './screens/Guides';
import { ImOk } from './screens/ImOk';
import { Where } from './screens/Where';
import { Go } from './screens/Go';
import { Kit } from './screens/Kit';
import { Plan } from './screens/Plan';
import { Share } from './screens/Share';
import { Import } from './screens/Import';
import { NotFound } from './screens/NotFound';
import { Maps } from './screens/Maps';
import { Battery } from './screens/Battery';
import { Quakes } from './screens/Quakes';
import { Trapped, Cpr, Sos, Drill } from './screens/Tools';
import { FirstAidList, FirstAidTopic } from './screens/FirstAid';
import { Lazy } from './components/Lazy';

const loadMapView = () => import('./screens/MapView');

export function App() {
  const { settings, lang, t } = useStore();
  const [page, a] = useRoute();

  useEffect(() => {
    document.documentElement.lang = lang;
    const root = document.documentElement;
    if (settings.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [lang, settings.theme]);

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
    default:
      return <NotFound />;
  }
}
