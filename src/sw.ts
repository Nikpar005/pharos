// Registers the service worker and reports when every file is cached,
// i.e. when the app will open with no connection at all.
import { useEffect, useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';

let ready = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller;
const listeners = new Set<(v: boolean) => void>();

export function startServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      ready = true;
      listeners.forEach((l) => l(true));
    }
  });
  navigator.serviceWorker.ready.then(() => {
    ready = true;
    listeners.forEach((l) => l(true));
  });
}

export function useOfflineReady(): boolean {
  const [v, setV] = useState(ready);
  useEffect(() => {
    listeners.add(setV);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}
