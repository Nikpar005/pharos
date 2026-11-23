import { render } from 'preact';
import { StoreProvider } from './store';
import { App } from './app';
import { loadAll } from './lib/storage';
import { startServiceWorker } from './sw';
import { isNative } from './lib/device';
import { warmUpVoices } from './lib/voice';
import { loadLanguage } from './i18n';
import './styles.css';

loadAll().then(async (initial) => {
  await loadLanguage(initial.settings.lang).catch(() => loadLanguage('en'));
  render(
    <StoreProvider initial={initial}>
      <App />
    </StoreProvider>,
    document.getElementById('app')!
  );
});

// Inside the Android app every file is already on the phone: no service worker needed.
if (import.meta.env.PROD && !isNative()) startServiceWorker();
warmUpVoices();
// A failed promise somewhere must never take the app down.
window.addEventListener('unhandledrejection', (e) => {
  console.warn('Pharos: unhandled', e.reason);
  e.preventDefault();
});
