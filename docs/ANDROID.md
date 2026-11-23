# Android app

The Android app is the same web app wrapped with [Capacitor](https://capacitorjs.com). Every file ships inside the app, so it works offline from the first launch. The `android/` folder is a normal Android Studio project.

What the app adds over the website:

- works offline even if it was never opened online
- live battery current in the hidden developer panel (`BatteryInfoPlugin.java`)
- reliable torch control for the SOS light
- installable from Google Play / F-Droid

What only the **website** can do: the Meshtastic/Web Bluetooth idea and the contact picker need Chrome; Android's WebView doesn't support them.

## Build without installing anything: GitHub Actions

Actions → **Android app** → *Run workflow*. When it finishes:

- the run **summary** shows the exact sizes (APK, App Bundle, web files inside)
- **Artifacts** → `pharos-debug-apk` is an APK you can install on your phone to test
  (allow "Install unknown apps" for your browser or Files app)

## Build on your computer

You need Android Studio (it includes the Android SDK and Java).

```bash
npm ci
npm run android        # builds the web app and copies it into android/
npm run android:open   # opens the project in Android Studio
```

Then ▶ Run on a phone connected by USB (with USB debugging on), or **Build → Generate Signed App Bundle** for Google Play.

## Releasing on Google Play

1. **Upload key.** Android Studio → Build → Generate Signed App Bundle → *Create new* keystore.
   Keep the `.jks` file and its passwords safe and **never commit them** (`*.jks` is git-ignored).
   Turn on *Play App Signing* so Google keeps the real signing key.
2. **Version.** Bump `versionCode` (by 1) and `versionName` in `android/app/build.gradle` for every upload.
3. **Play Console** ($25 once, ID verification). New personal accounts must run a **closed test with at least 12 testers for 14 days in a row** before production. Invite 15–20 people.
4. **Store listing:** privacy policy URL, Data safety form (Pharos collects and shares nothing), content rating, screenshots (`docs/screenshots/`).
5. Permissions to explain: location (shown only when you tap "Where am I?", the meeting point arrow or "include my location"). The app does **not** use the SMS permission: it opens your messages app.
