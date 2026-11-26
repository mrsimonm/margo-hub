# Task for Gemini: make margo-hub easy to change

Repo: `~/Projects/margo-hub` (static site, plain HTML/CSS/JS, no npm, no build step, GitHub Pages from `main`).
Subjects now: `stats`, `micro`, `opman`. Each is copied from a standalone repo `~/Projects/<id>-hub` by `node tools/sync-from-hubs.js`.

**Problem:** every subject is hard-coded by hand in ~8 places. Goal: ONE list of subjects + ONE command.
Do the steps in order. After each step run `node tools/validate.js`, open the site (`python3 -m http.server 8000`) and check that all 3 subjects still work. Don't change lesson content.

## Step 1: Registry
Create `subjects.json` with one entry per subject: `id, name, short, icon, code, sub, note, color, key, src, course`.
Copy the exact current values from `switcher.js` (HUBS), `index.html` (picker tiles) and `lib/stats.js` (HUBS).
Example: `{"id":"opman","name":"Op Man Hub","short":"Op Man","icon":"🏭","code":"3BE216","sub":"VŠE · 3BE216 Operations Management","note":"Drag & drop · Drills · Mock tests","color":"var(--ok)","key":"opmanHub.v1","src":"../opman-hub","course":"courses/opman"}`

## Step 2: One command `tools/hub.js` (plain Node, no packages)
- `node tools/hub.js sync`: does what `tools/sync-from-hubs.js` does, for every subject in `subjects.json`, then **generates** the parts below between marker comments `/* HUB:BEGIN */ … /* HUB:END */` (`<!-- -->` in HTML):
  - `switcher.js`: the `HUBS` array
  - `index.html`: the picker tiles and the list in the "reopen last subject" check
  - `sw.js`: the subject files in `SHELL`, the `navFallback` lines, and a bump of `V`
  - `lib/stats.js`: `HUBS` and `CATALOG`. Count `steps` (lines starting `## ` in steps.md), `q` (questions) and `voc` (vocab) from each lecture file, so the counts are never stale. Remove the remaining hard-coded subject names: the regex in `activeHubId` and the scope buttons must use `HUB_IDS`.
  - `tools/validate.js`: the `RUNS` list
  - then runs the validation.
- `node tools/hub.js add <id>` / `remove <id>`: edit `subjects.json`, then run `sync`.
- `node tools/hub.js check`: warn if (a) a file inside `margo-hub/<id>/` differs from the committed source repo (someone edited the copy, which sync would overwrite), or (b) a source repo has uncommitted changes.
- Keep `tools/sync-from-hubs.js` as a 1-line wrapper that calls `hub.js sync`.

## Step 3: Firestore rule
In `firestore.rules`, replace `hubId in ['bio','eco','geo','stats','micro','opman']` with `hubId.matches('^[a-z]{2,12}$')`. Tell Simon to run `firebase deploy --only firestore:rules` once.

## Step 4: Slide text for cheap edits
In each source repo add `slides/text/*.txt` (plain text of every PDF) so future edits don't re-read PDFs. Op Man PDFs: `~/Downloads/op.man/`.

## Step 5: Instructions for every AI
Write `AGENTS.md` (Gemini/Antigravity) and `CLAUDE.md` (same text) in margo-hub, with short recipes:
- **Edit or add a lecture:** work in `~/Projects/<id>-hub/courses/<id>/lectures/tN/` (see that repo's `AUTHORING.md`), commit there, then `node tools/hub.js sync` in margo-hub, commit, push. Never edit `margo-hub/<id>/` directly.
- **Add a subject:** build `~/Projects/<id>-hub` from `~/Projects/hub-kit/base`, commit, then `node tools/hub.js add <id>`, commit, push.
- **Remove a subject:** `node tools/hub.js remove <id>`, commit, push.
- **Sources rule:** facts come from slides, PDFs and answer keys; lecture transcripts (Wispr Flow) are context only.
- Commit identity: `mrsimonm` / `322631765+mrsimonm@users.noreply.github.com`.
Also add Op Man to `~/Projects/hub-kit/OUTLINE.md`.

## Done when
- `node tools/hub.js sync` and `check` run clean; all 3 subjects open, Subjects ▾ lists 3, the stats page shows 3.
- Removing and re-adding `micro` with the commands leaves `git diff` empty.
- Commit and push `main`; https://mrsimonm.github.io/margo-hub/ still works.
