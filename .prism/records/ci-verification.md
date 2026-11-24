---
id: "ci-verification"
type: "Task"
title: "Establish passing cross-platform CI"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["current","blocker","quality"]
relationships: ["quality-gates","lockfile","acceptance-baseline"]
---
Inspect the actual GitHub Actions runs and logs; earlier runs failed. Local success does not establish CI success. Require typecheck, unit/integration tests, build and security audit on supported Windows/Linux Node combinations. Use npm ci after lockfile baseline. Record check URLs and the tested revision.

2026-11-24: run 45325390198 at bb3d0f0 reports all four matrix jobs failed. The job steps are empty and the log endpoint for job 138213624100 returns BlobNotFound; the root cause is not established. Link: https://github.com/aschenrot/prism/actions/runs/45325390198. Strict npm ci is now configured. Inspect the next actual run; do not infer a successful build from a workflow edit.

Latest observed: run 45327506174 at b0bcb3fd03dc5817b002eecdffe2a95f49114932 reports failure for all four OS/Node matrix jobs, with no step details returned in the job summaries. Root cause still unknown. https://github.com/aschenrot/prism/actions/runs/45327506174

Acceptance includes clean npm ci from the committed lockfile on Windows and Linux, passing typecheck/test/build and security audit. This is separate from the completed lockfile commit task.
