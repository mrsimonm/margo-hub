# Micro Hub: handoff for Claude, Claude Code or Antigravity

Read this first, then `AGENTS.md` (the hard rules), then `AUTHORING.md` (lecture data format) and `PROMPT.md`.

## What this is

A study web app for **VŠE 3BE123 Microeconomics** (winter semester 2026/27, lecturer and seminar leader Ing. Zuzana Dzbánková, Ph.D.). Third hub next to Statistics Hub and Geology Hub, same engine, same Study Cat.

- Project folder on this Mac: `/Users/simonmusel/Projects/micro-hub`
- Not on GitHub yet. Plan: public repo `mrsimonm/micro-hub`, GitHub Pages from `main` root → `https://mrsimonm.github.io/micro-hub/`
- Progress is saved in the browser (`localStorage` keys `microHub.*`). Google sign-in sync is ready in code but **off** until a Firebase project is created and its config pasted into `lib/firebase-config.js` (then publish `firestore.rules` and add the Pages domain to the authorised domains).
- Offline PWA: `sw.js`, cache `micro-hub-v1`. Bump it when you change the shell files.

## Course facts (from "Criteria and assessment.pdf")

- Activity 10 %, two written tests 40 % (20 points each, at least 20 of 40 to go to the oral exam), oral exam 50 %.
- Tests: 45 minutes on paper. Definitions, computation, graphs, formulas. No formula sheet.
- **Test 1** (topics 1–6): done 10 Nov.
- **Test 2** (topics 7–11): 15 Dec, in the seminar. Perfect competition (optimum SR/LR, market equilibrium), imperfect markets, alternative goals of firms, factor markets and land, labour market.
- **Oral exam**: 20 topics (list in `Oral_exam_questions.pdf`), blind draw, ~15 min written preparation.

## What is built (22 Nov 2026)

| Lecture | Source slides | Contents |
|---|---|---|
| `t7` Firm in Perfect Competition | `Lecture6.pdf` (titled "7. Lecture"), Seminar 6 homework | revenue and profit types, MR = MC, price-taker, P = MC, short-run results, shut-down point, supply curve, break-even point |
| `t8` Market Equilibrium & Imperfect Competition | `Present7_8.pdf` (week 8) | equilibrium and efficiency, CS/PS, time periods and shifts, ceiling/floor/tax, imperfect competition features, MR < P, Lerner index, deadweight loss |

Plus: `apply/s7.json` (Seminar 6 perfect-competition homework, word for word), `path/test2.json`, formula panel, 5 interactive graphs and 7 drill types in `lib/graphs.js`.

The student's materials (PDFs, two video lectures) are in `~/Downloads/microeconomics/`, local only. Extract slide text with `swift tools/pdf-to-text.swift in.pdf out.txt`.

## To do

1. **Weekly**: add each new lecture as `courses/micro/lectures/tN/` (topic 8 rest: monopoly, oligopoly, monopolistic competition; 9 alternative goals; 10 factor markets, land; 11 labour market), list it in `course.json` (top-level `lectures` and `tests[test2].lectures`, remove it from `planned`), add drills or graphs where there is maths.
2. Oral exam practice (random topic, 15-minute timer, model answer) after Test 2.
3. Test 1 topics (1–6) for oral exam revision; slides are in the student's folder.
4. Firebase project for Google sign-in.
5. The excise-tax bit in `t8` step 4 is marked `TODO: verify` (the slide is only a graph).

## How to run and check

```bash
python3 -m http.server 8000      # then open http://localhost:8000
node tools/validate.js courses/micro
```

Commit with the GitHub noreply identity, like the other hubs:

```bash
git -c user.name=mrsimonm -c user.email=322631765+mrsimonm@users.noreply.github.com commit
```
