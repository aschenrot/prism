---
id: "ci-verification"
type: "Task"
title: "Establish passing cross-platform CI"
status: "Concept"
priority: "High"
accent: "rose"
tags: ["current","blocker","quality"]
relationships: ["quality-gates","lockfile","acceptance-baseline"]
---
Inspect the actual GitHub Actions runs and logs; earlier runs failed. Local success does not establish CI success. Require typecheck, unit/integration tests, build and security audit on supported Windows/Linux Node combinations. Use npm ci after lockfile baseline. Record check URLs and the tested revision.
