---
id: "lockfile"
type: "Task"
title: "Commit verified package-lock.json"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["current","blocker","dependencies"]
relationships: ["quality-gates","dependency-policy","ci-verification"]
---
The owner committed package-lock.json. Inspection at bb3d0f0 confirmed lockfile version 3, matching root dependency and devDependency declarations, and no credential-bearing or non-public-registry resolved URLs. CI now requires npm ci rather than falling back to npm install. Emberfall Cargo.lock is also committed.

Acceptance still pending: clean npm ci, typecheck, tests and build on supported Windows/Linux environments; attach actual run evidence. Do not mark Ready merely because the lockfile exists.
