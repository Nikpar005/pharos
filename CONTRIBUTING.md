# Contributing to Pharos

Thank you! People will rely on this app on a very bad day, so we care about two things above all: **the information must be correct** and **the app must work offline on any phone**.

There are three paths. Pick the one that fits you.

## 1. Add your country (no code)

1. Copy `content/countries/gr.yaml` to `content/countries/<code>.yaml` (ISO 3166 two-letter code, lowercase).
2. Fill in the emergency number, other numbers and their labels.
3. Add at least one **official https source** (government or civil protection site) that lists these numbers.
4. Keep `status: draft`. A maintainer marks it `reviewed` after checking the sources.
5. Run `npm run content:check` and open a pull request.

## 2. Translate (no code)

- **Interface:** copy `src/i18n/en.json` to `src/i18n/<lang>.json`, translate the values (not the keys), keep `{placeholders}` exactly as they are, then add the language to `languages` in `src/i18n/index.ts` and to `LOCALES` in `schemas/content.mjs`.
- **Guides and kit:** add a `<lang>:` block next to `en:` in each YAML file.

A test checks that every language has the same keys and placeholders.

## 3. Code

```bash
npm ci
npm run dev
npm run check   # run before every PR
```

Rules for code changes:

- **Offline:** everything that matters in an emergency works with no network. The only network use is user-initiated and clearly labelled (downloading a map, "Earthquakes now"). New core assets are precached by the service worker.
- **Weight:** start-up JS must stay under the budget in `scripts/check-size.mjs`. Lazy-load anything big that only one screen uses (see `src/screens/Share.tsx` and the map in `src/app.tsx`).
- **Licences:** dependencies must be MIT, BSD, Apache-2.0 or similar. No GPL code in the app bundle unless the project decides to relicense.
- **Battery:** no timers or polling. Sensors (GPS, compass) only while their screen is open, and stopped on unmount.
- **Privacy:** no analytics, trackers, third-party scripts or fonts. User data never leaves the device unless the user explicitly shares it.
- **Accessibility:** real `<button>`/`<a>`/`<label>`, touch targets of 44px or more, text contrast of 4.5:1 or more, and it must work with a screen reader.
- **Logic goes in `src/lib/`** with a unit test in `tests/`.

## Content rules

These rules apply to everything in `content/` (guides, procedures such as CPR, country data, the kit list).

1. **Every instruction has an official source.** Civil protection, fire service, health authority, Red Cross. Blogs, news and AI-generated text don't count. CI rejects a file without an `https` source.
2. **Say what to do, in plain words.** Short sentences, one action per step, no jargon. Imagine reading it with shaking hands.
3. **`draft` until checked.** A file becomes `status: reviewed` only when a maintainer has compared every line with its sources, and must then have `last_reviewed` (YYYY-MM-DD) and `reviewed_by`. The app shows a "draft" banner until then.
4. **Re-check every 12 months.** Official advice changes.
5. **Never invent numbers.** No quantities, distances or times unless the source states them.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `content:`, `i18n:`, `docs:`, `chore:`.

## Code of conduct

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
