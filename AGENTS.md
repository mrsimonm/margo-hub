# Margo's Study Hub (`margo-hub`): Instructions for AI Agents

Unified static study app (plain HTML/CSS/JS, no npm, no build step, served on GitHub Pages from `main` at https://mrsimonm.github.io/margo-hub/).

Each subject (`stats`, `micro`, `opman`, …) lives in its own standalone repository at `~/Projects/<id>-hub` and is synced into `margo-hub/<id>/` from a single registry (`subjects.json`) using `node tools/hub.js`.

## Key Files
- `subjects.json` — Single source of truth for all subjects (`id`, `name`, `short`, `icon`, `code`, `sub`, `desc`, `note`, `color`, `key`, `src`, `course`).
- `tools/hub.js` — Single plain-Node CLI (`sync`, `add <id>`, `remove <id>`, `check`). Regenerates `/* HUB:BEGIN */ … /* HUB:END */` (`<!-- HUB:BEGIN --> … <!-- HUB:END -->` in HTML) blocks in `switcher.js`, `index.html`, `sw.js` (plus cache version `V`), `lib/stats.js` (`HUBS` + live lecture `CATALOG` counts), and `tools/validate.js`, then runs validation.
- `lib/cat.js`, `lib/stats.js`, `lib/firebase-config.js`, `lib/firebase-sync.js`, `switcher.js` — Shared Study Cat, quantitative study statistics, unified Google/Firestore sync, and top-bar `Subjects ▾` switcher injected into every synced subject.
- `~/Projects/<id>-hub/slides/text/*.txt` — Extracted plain text of every slide deck / PDF (`swift tools/pdf-to-text.swift in.pdf out.txt`). Read these `.txt` files first instead of re-reading raw PDFs.

## Recipes

### Edit or add a lecture
1. Work in `~/Projects/<id>-hub/courses/<id>/lectures/tN/` (read that repo's `AGENTS.md`, `AUTHORING.md`, and `slides/text/*.txt`). **Never edit `margo-hub/<id>/` directly** — `sync` overwrites it.
2. Validate and commit in `~/Projects/<id>-hub`:
   ```bash
   node tools/validate.js courses/<id>
   git -c user.name=mrsimonm -c user.email=322631765+mrsimonm@users.noreply.github.com commit -am "..."
   ```
3. Sync into `margo-hub`, verify, commit, and push:
   ```bash
   cd ~/Projects/margo-hub
   node tools/hub.js sync
   node tools/hub.js check
   git -c user.name=mrsimonm -c user.email=322631765+mrsimonm@users.noreply.github.com commit -am "..."
   git push
   ```

### Add a subject
1. Build `~/Projects/<id>-hub` from `~/Projects/hub-kit/base` (`<id>` must match `^[a-z]{2,12}$`, excluding `cat` and `analytics`), extract `slides/text/*.txt`, validate, and commit there.
2. In `~/Projects/margo-hub`:
   ```bash
   node tools/hub.js add <id>
   ```
   *(Optional: refine `icon`, `color`, `short`, `desc`, or `note` in `subjects.json` and re-run `node tools/hub.js sync`.)*
3. Commit and push `main`. *(Firestore rules already allow any `hubId` matching `^[a-z]{2,12}$`, so no rules redeploy is needed.)*

### Remove a subject
```bash
cd ~/Projects/margo-hub
node tools/hub.js remove <id>
git -c user.name=mrsimonm -c user.email=322631765+mrsimonm@users.noreply.github.com commit -am "Remove <id>"
git push
```

### Check for drift or uncommitted source edits
```bash
node tools/hub.js check
```
Warns if any file inside `margo-hub/<id>/` differs from the committed `HEAD` of `~/Projects/<id>-hub`, or if a source repo has uncommitted changes.

## Hard Rules
- **Sources rule:** Facts, formulas, definitions, and spelling come strictly from slides, seminar PDFs, and official answer keys (`slides/text/*.txt`). Lecture transcripts (Wispr Flow) are context only (what the teacher stresses, examples, exam tips); anything only in a transcript must be marked *"From the lecture (no slide)"*.
- **No build step / no npm:** Plain HTML, CSS, and JS only. Keep phone layout (16px gutters, no horizontal scroll) and light/dark CSS variables working.
- **Local preview:** `python3 -m http.server 8000` and check the root picker (`/?pick=1`), `Subjects ▾`, `📊 Stats`, and each subject.
- **Commit identity:** Always commit as `mrsimonm` / `322631765+mrsimonm@users.noreply.github.com`:
  ```bash
  git -c user.name=mrsimonm -c user.email=322631765+mrsimonm@users.noreply.github.com commit
  ```
