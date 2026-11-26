#!/usr/bin/env node
/* Runs each sub-hub's lecture validator across Statistics Hub, Micro Hub and Op Man Hub. */
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const RUNS = [
  /* HUB:BEGIN */
  { label: "Statistics Hub", cwd: path.join(ROOT, "stats"), args: ["tools/validate.js", "courses/stats"] },
  { label: "Micro Hub", cwd: path.join(ROOT, "micro"), args: ["tools/validate.js", "courses/micro"] },
  { label: "Op Man Hub", cwd: path.join(ROOT, "opman"), args: ["tools/validate.js", "courses/opman"] }
  /* HUB:END */
];

let failed = false;
RUNS.forEach((r) => {
  console.log("=== " + r.label + " ===");
  const res = spawnSync(process.execPath, r.args, { cwd: r.cwd, stdio: "inherit" });
  if (res.status !== 0) failed = true;
});

process.exit(failed ? 1 : 0);
