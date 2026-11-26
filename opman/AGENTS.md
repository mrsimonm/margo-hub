# Op Man Hub: notes for the coding agent

A static, no-build study site for VŠE Prague Operations Management (**3BE216**, Felipe Martinez). Plain HTML, CSS and JS. Same engine as Micro Hub (`../micro-hub`) and Statistics Hub (`../stats-hub`).

## Structure
- `index.html`: markup and all CSS (the `om-*` rules at the end belong to `lib/opman.js`).
- `app.js`: shared engine (Home by test, lessons, quizzes, flashcards, games, Mastery, XP/streak, glossary, exam practice). Defines `window.GEO`.
- `lib/formulas.js`: the "∑ Formulas" panel with stable ids (`m-cmu`, `t-need`, `s-par`, `k-q`, …) used by `courses/opman/apply/*.json` and the study paths.
- `lib/opman.js`: interactive widgets, mounted from placeholders in `steps.md` / path bites: `bars`, `seqline`, `breakeven`, `rules`, `sort`, `order`, `trap`, `explain`, `drill` (kinds: cmu-sheet, bars, wine, time-start, avail, little, seq-lead, be, rules, gantt) and `mock` (data-test 1 or 2).
- `courses/opman/course.json`: lectures t1–t7, tests (test2, state, test1), apply sets a2–a5 (set id digit = lesson number), paths test2 and test1.

## Rules
- Facts, terms and spelling come from the slides, seminar PDFs and practice-test answer keys. The lecture transcripts are context only (what the teacher stresses, his examples, exam tips); anything that exists only in a transcript is marked "From the lecture (no slide)".
- `leadTimes()` in `lib/opman.js` reproduces every gradual / parallel / DBR number in the Seminar 7 slides and the Test 2 key. Re-check those numbers after any change to it.
- Must work on a phone (16px gutters, no horizontal page scroll) and in light and dark mode. Use the CSS variables, never hard-coded colours.
- After any change run `node tools/validate.js courses/opman` and fix every ERROR. Bump `V` in `sw.js` if shell files change.
- Commit with the GitHub noreply identity (`mrsimonm` / `322631765+mrsimonm@users.noreply.github.com`).
