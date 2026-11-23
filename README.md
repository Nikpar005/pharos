# Pharos

**Everything you need in an emergency. No internet needed.**

Pharos (Greek for *lighthouse*) is a free, open-source emergency app for earthquakes, wildfires, floods and heatwaves. After the first visit it works completely offline, it never asks for an account, and everything you type stays on your phone.

[![CI](https://github.com/Nikpar005/pharos/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikpar005/pharos/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/code-MIT-blue)
![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-green)

<p>
  <img src="docs/screenshots/home.png" width="200" alt="Home screen with Call 112 and I'm okay buttons">
  <img src="docs/screenshots/guide.png" width="200" alt="Earthquake guide: Drop, Cover, Hold on">
  <img src="docs/screenshots/imok.png" width="200" alt="I'm okay SMS screen">
  <img src="docs/screenshots/go.png" width="200" alt="Arrow and distance to the meeting point">
</p>

> ⚠️ Pharos does not replace 112 or instructions from the authorities. The guides are **drafts** until each one is checked against its official source (see [Content rules](CONTRIBUTING.md#content-rules)).

## What it does

| | |
|---|---|
| **Call 112** | One big button. A normal phone call, so it works without internet. |
| **"I'm okay"** | Opens your messages app with a ready text to the people you chose, optionally with your coordinates. SMS often gets through when data doesn't. |
| **Where am I?** | Big GPS coordinates to read out to the 112 operator. GPS works without internet. |
| **Meeting point** | Distance and an arrow to your family's meeting point. Uses only GPS and the compass, with no map download. |
| **Guides** | What to do before, during and after each hazard, with the official source on every guide. |
| **Emergency kit** | A checklist with a 6-month reminder to check expiry dates. |
| **Family plan** | Meeting points, an out-of-area contact, members' needs. Print it, or share it with a QR code. |
| **Offline maps** | Download your region once (Attica, Evia, Andros…). Hospitals, pharmacies, drinking water and your meeting points are highlighted. |
| **I'm trapped** | A loud distress whistle (3 blasts, pause) on a black screen, plus what to do while you wait for rescuers. |
| **First aid** | 18 topics (bleeding, burns, choking, recovery position, heatstroke, poisoning, stroke…), based on the ΕΚΑΒ handbook. Loaded only when opened (~9 KB). |
| **CPR** | Step-by-step guide with a 110 bpm metronome and a 30-compression counter. |
| **SOS light** | Torch and screen flash ··· ––– ···, slow enough to be safe for photosensitive people. |
| **Family drill** | A 5-minute checklist, suggested every 6 months. |
| **Simple mode** | Just "Call 112" and "I'm okay", huge, for older relatives. |
| **Battery** | Time left and saving tips (and a warning on Home under 20%). Hidden developer panel with live mA in the Android app: tap the logo 7 times. |
| **Earthquakes now** | Latest quakes around Greece from EMSC, when online. Clearly marked as *not* an official warning. |

## How it is built (and why)

- **Offline-first PWA.** A service worker caches every file on the first visit. Nothing is fetched at runtime.
- **Small enough for old phones.** Preact, no UI library, no web fonts, inline SVG icons. Start-up is about 27 KB of gzipped JS, and CI fails if it grows past the [budget](scripts/check-size.mjs).
- **Heavy parts load only when used.** The map engine (MapLibre, ~460 KB) is downloaded together with your first map region, never on a normal visit.
- **Battery-friendly.** GPS is read once when you ask, not in the background. The compass only runs while its screen is open and redraws only when the heading moves 3° or more. Night mode is true black, which saves power on OLED screens.
- **No server, no tracking.** Data is in IndexedDB on your device. A shared plan travels inside the link's `#fragment`, which browsers never send to any server ([how](src/lib/plan.ts)).
- **Content is data.** Guides, countries and the kit list are YAML files validated by [schemas](schemas/content.mjs). Adding a country or a language needs no code.

```
content/          guides, countries, kit list (YAML), the part most contributors touch
schemas/          what valid content looks like (Zod)
scripts/          content build + size budget
src/lib/          SMS links, geo maths, plan sharing, storage (unit tested)
src/screens/      one file per screen
src/i18n/         interface text, one JSON per language
tests/            Vitest
```

## Sizes

| What | Size |
|---|---|
| First visit (everything for offline use) | ~240 KB (~120 KB over the network, compressed) |
| Start-up code | ~39 KB JS + ~4 KB CSS (gzipped), budget enforced in CI |
| Map engine + label fonts, once, with the first map | ~0.5 MB + ~0.46 MB |
| Each map region | measured by the *Build offline maps* workflow (see its run summary) |
| Android app | measured by the *Android app* workflow (see its run summary) |
| Your data (plan, kit, settings) | a few KB |

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # everything CI runs: content, types, tests, build, size
```

Offline mode only works in a production build: `npm run build && npm run preview`, then turn on airplane mode.

**Maps:** run the *Build offline maps* workflow once (Actions tab). It cuts each region in [`content/regions.yaml`](content/regions.yaml) from OpenStreetMap, publishes them to the `maps` release, and the Pages deploy serves them. To add a region, add its bounding box there.

**Android:** see [docs/ANDROID.md](docs/ANDROID.md).

Browser support: Chrome/Android 80+, Safari/iOS 14+. Some features depend on the platform: battery level (not on iPhone), live battery current and reliable torch (Android app only), contact picker (Android Chrome).

## Contribute

You don't need to write code to help. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the easiest ways to start:

- **Add your country** (one YAML file)
- **Translate** the app or a guide
- **Check a guide** against official sources so it can lose its "draft" label

Look for issues labelled [`good first issue`](https://github.com/Nikpar005/pharos/labels/good%20first%20issue).

## Roadmap

- [x] Offline core: 112, "I'm okay", location, guides, kit, family plan, QR sharing
- [x] Offline maps, trapped whistle, CPR metronome, SOS light, drill, simple mode, battery panel, earthquakes feed
- [x] Android app project (Capacitor) with size-reporting build
- [ ] Every guide reviewed against official sources (Greece, Cyprus)
- [ ] More countries and languages
- [ ] End-to-end tests (Playwright) that run the app in airplane mode
- [ ] Official municipal shelters / assembly points as open data on the map
- [ ] Messages without any network via Meshtastic (LoRa) radios (needs a licence decision: its libraries are GPL-3.0)
- [ ] `pharos-cli` in Rust: link checking and review-date reports for the content
- [ ] Publish on Google Play and F-Droid

## Where the information comes from

Every guide, procedure and number lists its official sources in its file under [`content/`](content/) and on screen. The main ones:

- **First aid and CPR:** ΕΚΑΒ, *«Μαθαίνω Πρώτες Βοήθειες – Είμαι ασφαλής»*, published by the Greek Ministry of Health ([moh.gov.gr](https://moh.gov.gr/articles/health/dieythynsh-prwtobathmias-frontidas-ygeias/draseis-kai-programmata-agwghs-ygeias/agwgh-ygeias/entypo-kai-optikoakoystiko-yliko/12791-bibliario-prwtwn-bohtheiwn?fdl=27980)), and the European Resuscitation Council Guidelines 2021. Written in our own words, not copied.
- **Earthquakes, wildfires, floods:** ΟΑΣΠ, General Secretariat for Civil Protection, Hellenic Fire Service.
- **Heatwaves:** ΕΟΔΥ.
- **Maps:** © OpenStreetMap contributors (ODbL), via Protomaps. **Earthquake feed:** EMSC (CC BY 4.0), USGS.

None of these organisations endorse Pharos. All safety content is marked *draft* until a maintainer has checked it line by line against its source.

## License

Code: [MIT](LICENSE). Content in `content/`: [CC BY-SA 4.0](content/LICENSE.md).

---

### Ελληνικά

Το Pharos είναι δωρεάν εφαρμογή ανοιχτού κώδικα για σεισμό, πυρκαγιά, πλημμύρα και καύσωνα. Μετά το πρώτο άνοιγμα δουλεύει χωρίς internet, δεν θέλει λογαριασμό και ό,τι γράφεις μένει στο κινητό σου. Για να βοηθήσεις, δες το [CONTRIBUTING.md](CONTRIBUTING.md).
