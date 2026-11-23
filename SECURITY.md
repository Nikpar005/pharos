# Security and safety

## Reporting

Please **do not open a public issue** for:

- a security vulnerability (for example in plan import links), or
- safety information that is dangerously wrong and could hurt someone.

Use GitHub's **private vulnerability reporting** (Security tab → "Report a vulnerability") or email **nikpar005@gmail.com**. You will get a reply within 7 days.

## Design notes

- Pharos has no server and no accounts. User data lives in the browser's IndexedDB on the device.
- Shared plan links carry the plan in the URL fragment (`#…`), which browsers do not send to servers. Anyone who has the link can read the plan, and the app tells users this before they share.
- Imported plans are treated as untrusted input: validated, length-capped and never rendered as HTML (`src/lib/plan.ts → sanitizePlan`).
