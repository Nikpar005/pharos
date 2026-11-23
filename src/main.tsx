import { render } from 'preact';
import { StoreProvider } from './store';
import { App } from './app';
import { loadAll } from './lib/storage';
import { startServiceWorker } from './sw';
import { isNative } from './lib/device';
import './styles.css';

loadAll().then((initial) => {
  render(
    <StoreProvider initial={initial}>
      <App />
    </StoreProvider>,
    document.getElementById('app')!
  );
});

// Inside the Android app every file is already on the phone: no service worker needed.
if (import.meta.env.PROD && !isNative()) startServiceWorker();
