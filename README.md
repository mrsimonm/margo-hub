# Margo's Study Hub

Unified study app for Margo's VŠE Prague subjects: **Statistics Hub** (`4ST601`) and **Micro Hub** (`3BE123`), with a **Subjects ▾** dropdown in the top bar to switch subjects anytime.

Same engine as Simon's Study Hub (`~/Projects/study-hub`): one Google sign-in (Firebase project `geo-hub-96426`), one shared Study Cat and the Statistics dashboard.

- Progress syncs to `users/{uid}/hubs/stats` and `users/{uid}/hubs/micro`.
- Local storage keys are namespaced `margoHub.*`, so her data never mixes with Simon's Study Hub on the same device.
- Standalone hubs (`stats-hub`, `micro-hub`) remain separate and untouched.

## Run and check locally

```bash
python3 -m http.server 8000      # open http://localhost:8000
node tools/validate.js           # validate both subjects
node tools/sync-from-hubs.js     # re-sync stats/ and micro/ from ~/Projects/stats-hub and ~/Projects/micro-hub
```
