import type { CapacitorConfig } from '@capacitor/cli';

// The Android app wraps the same web build (dist/). Every file ships inside
// the app, so it works offline from the very first launch.
const config: CapacitorConfig = {
  appId: 'me.nikpar.pharos',
  appName: 'Pharos',
  webDir: 'dist',
  android: {
    // Keep the WebView lean: no remote debugging in release builds.
    webContentsDebuggingEnabled: false
  }
};

export default config;
