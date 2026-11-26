# Study Hub: notes for the coding agent

Unified static study site combining **Statistics Hub**, **Micro Hub** and **Op Man Hub** into a single PWA with a top-bar subject switcher dropdown (`switcher.js`).

## Structure
- `index.html`: reopens the last subject studied (`localStorage` key `margoHub.last`), or shows the subject picker screen on first visit / `?pick=1`.
- `switcher.js`: adds the `Subjects ▾` button and dropdown menu to `.top .brand` inside every sub-hub without altering hub logic or layout.
- `stats/`, `micro/`, `opman/`: exact copies of `~/Projects/stats-hub`, `~/Projects/micro-hub` and `~/Projects/opman-hub`, wired to `../manifest.webmanifest`, `../sw.js`, and `../switcher.js`.
- `sw.js`, `manifest.webmanifest`, `icon-*.png`: unified offline PWA shell covering all three subjects.
- `tools/sync-from-hubs.js`: re-syncs `stats/` and `micro/` cleanly from the standalone project folders.
- `tools/validate.js`: runs lecture validation across both subjects.

## Rules
- Plain HTML, CSS and JS only. No npm, no frameworks, no build step.
- Mobile-first (16px side gutters, no horizontal page scroll) and light/dark mode using existing CSS variables only.
- Keep standalone `~/Projects/stats-hub` and `~/Projects/micro-hub` untouched unless explicitly asked.
- After any change run `node tools/validate.js` and bump `V` in `sw.js` if shell files changed.
- Commit with the GitHub noreply identity (`mrsimonm` / `322631765+mrsimonm@users.noreply.github.com`).
