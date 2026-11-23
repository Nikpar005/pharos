# Ideas for contributors

Each idea below is written so it can be pasted into a GitHub issue. If you
want to work on one, open an issue first so two people don't build the same
thing. Labels in brackets are suggestions.

## Good first issues

### Add a new language  `[good first issue] [i18n]`
Copy `src/i18n/en.json` to a new file (for example `de.json`), translate the
values, add the language to `languages` and `loaders` in `src/i18n/index.ts`.
Only the chosen language is downloaded, so adding languages costs nothing at
start-up. Medical text in `content/` needs a source in that language too.

### Add your country  `[good first issue] [content]`
Copy `content/countries/gr.yaml`, change the numbers and links, and cite an
official source for every number. `npm run content` validates the file.

### More phrases for tourists  `[good first issue] [content]`
`content/extras.yaml → phrases`. Keep each phrase short and add it in every
language already listed.

### Icons for the readiness list  `[good first issue] [ui]`
The readiness screen uses the same icon for every row. Pick a fitting icon
from `src/components/Icon.tsx` for each item.

## Bigger pieces

### Medical review of first-aid content  `[content] [help wanted]`
Every procedure is marked *draft* until someone with a medical background
(doctor, nurse, ΕΚΑΒ / Red Cross instructor) checks it against ERC 2025 and the
ΕΚΑΒ handbook and sets `status: reviewed` with their name in `reviewedBy`.

### Kids / school mode  `[feature]`
A simpler home screen with pictures, a "what to do in an earthquake at
school" walkthrough and a drill a teacher can run with a class.

### On-duty hospitals offline  `[feature] [data]`
The Ministry of Health publishes on-duty hospital lists as PDFs. A CI job
could turn them into JSON once a day so the list works offline for the
next 24 hours. Needs care: wrong data here is dangerous, so show the date
and the source on screen.

### ERT radio frequencies  `[content] [needs source]`
During a power cut, FM radio is often the only news. We need an official
list of ERT FM frequencies per region before adding them; please link the
source in the issue.

### Mesh messaging without network  `[research]`
Look at Meshtastic or Bluetooth/Wi-Fi Direct for sending "I'm OK" between
nearby phones when there is no signal. Meshtastic is GPL-3.0, so this
probably has to be a separate companion app; discuss licensing first.

### Lighthouse / performance CI  `[ci]`
Run Lighthouse on every pull request and fail if performance drops below 95
or start-up JS goes over budget (`scripts/check-size.mjs` already checks the
size).

### iOS build  `[platform]`
The web app works on iPhone as a PWA. A Capacitor iOS build would add home
screen widgets and Siri shortcuts. Needs someone with a Mac.
