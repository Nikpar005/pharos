# Android app

The Android app is the same web app wrapped with [Capacitor](https://capacitorjs.com). Every file ships inside the app, so it works offline from the first launch. The `android/` folder is a normal Android Studio project.

What the app adds over the website:

- works offline even if it was never opened online
- live battery current in the hidden developer panel (`BatteryInfoPlugin.java`)
- reliable torch control for the SOS light
- installable from Google Play / F-Droid

What only the **website** can do: the Meshtastic/Web Bluetooth idea and the contact picker need Chrome; Android's WebView doesn't support them.

## Get an APK: GitHub Actions

**Download link for users** (always the newest release):
https://github.com/Nikpar005/pharos/releases/latest/download/pharos.apk

**Publish a new version:**

1. Change `"version"` in `package.json` (for example `0.3.0` → `0.3.1`). The Android
   `versionCode` is calculated from it, so nothing else needs editing.
2. Create a tag and push it:
   ```bash
   git tag v0.3.1
   git push origin v0.3.1
   ```
   Or on github.com: **Releases → Draft a new release → Choose a tag → type `v0.3.1` → Publish**.
3. The **Android app** workflow builds `pharos.apk` and attaches it to the release.

**Just a test build:** Actions → **Android app** → *Run workflow*. The APK is under
*Artifacts* on the run page (GitHub zips it; unzip it on the phone). The run summary shows the sizes.

### Signing key (do this once, before you share the APK widely)

Android only installs an update if it is signed with the **same key** as the installed app.
Without a key in the repository secrets, every build is signed with a new temporary key,
so updating means uninstalling first. To fix this:

1. Make a key on your computer (`keytool` comes with Android Studio, in `jbr/bin`):
   ```bash
   keytool -genkeypair -v -keystore pharos.jks -alias pharos -keyalg RSA -keysize 4096 -validity 10000
   ```
2. Turn it into text:
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("pharos.jks")) | Set-Clipboard`
   - macOS / Linux: `base64 -w0 pharos.jks` (macOS: `base64 -i pharos.jks`)
3. github.com → repository **Settings → Secrets and variables → Actions → New repository secret**, add:

   | Name | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | the text from step 2 |
   | `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
   | `ANDROID_KEY_ALIAS` | `pharos` |
   | `ANDROID_KEY_PASSWORD` | the key password (same as above if you pressed Enter) |

4. Keep `pharos.jks` and the passwords somewhere safe (a password manager and a USB stick).
   **If you lose them, you can never update the APK again**; people would have to uninstall and reinstall.
   Never commit the file (`*.jks` is git-ignored).

The run summary and the release notes say which key signed the APK.

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
2. **Version.** Bump `version` in `package.json` for every upload; `versionCode` follows from it. The `.aab` for Play is on every Android workflow run (artifact `pharos-<version>-play-bundle`).
3. **Play Console** ($25 once, ID verification). New personal accounts must run a **closed test with at least 12 testers for 14 days in a row** before production. Invite 15–20 people.
4. **Store listing:** privacy policy URL, Data safety form (Pharos collects and shares nothing), content rating, screenshots (`docs/screenshots/`).
5. Permissions to explain: location (shown only when you tap "Where am I?", the meeting point arrow or "include my location"). The app does **not** use the SMS permission: it opens your messages app.
