# Micro Hub: notes for the coding agent

A static, no-build study site for VŠE Prague Microeconomics (**3BE123**, Ing. Zuzana Dzbánková). Keep it plain HTML, CSS and JS. Same engine as Statistics Hub (`../stats-hub`) and Geology Hub (`../geo-hub`).

## Structure
- `index.html`: markup and all CSS. Loads Firebase compat SDK, `lib/firebase-config.js`, `lib/firebase-sync.js`, `lib/lecture-lib.js`, `lib/formulas.js`, `lib/apply.js`, `lib/path.js`, `app.js`, `lib/cat.js`, `lib/graphs.js`, then calls `GEO.start()`.
- `app.js`: shared engine (Home by test, lessons, quizzes, flashcards, games, Mastery, XP/streak, glossary, exam practice). Defines `window.GEO`.
- `lib/formulas.js`: the "∑ Formulas" panel. Typed micro formulas with stable ids (`pc-opt`, `r-tr`, …) used by `apply/*.json`.
- `lib/graphs.js`: interactive graphs and calculation drills, mounted from placeholders like `<div class="mg" data-g="pc-firm"></div>` inside `steps.md`.
- `courses/micro/course.json`: course metadata, `lectures[]`, `tests[]` (`test2`, `oral`, `test1`), `apply[]`, `paths[]`.
- `courses/micro/lectures/tN/`: one folder per lecture (`lecture.json` + `steps.md`). Folder number = syllabus topic number.
- `courses/micro/apply/*.json`: real seminar exercises (pick the formula, type the number).
- `courses/micro/path/test2.json`: the "Start studying for Test 2" walk-through.

## Rules
- No build step, no npm, no frameworks. Plain HTML, CSS and JS. Script paths stay relative.
- Must work on a phone (16px side gutters, no horizontal page scroll) and in light and dark mode. Use existing CSS variables, never hard-coded colours.
- Colour meanings: accent = idea, amber = teacher said, red = exam trap, green = correct, cyan = analogy, grey = don't memorise.
- Facts must match Ing. Dzbánková's slides. If unsure, write `TODO: verify` instead of guessing.
- In `facts`, exactly one `{right|wrong1|wrong2|wrong3}` gap per sentence, and the right answer must be plain typable words or a number.
- The student finds algebra hard: every calculation should come with a step-by-step "how" (drills in `lib/graphs.js`, `model` in apply parts).
- After any change run `node tools/validate.js courses/micro` and fix every ERROR. List the files you changed. Do not rename or delete files.
- Start with `HANDOFF.md`.
