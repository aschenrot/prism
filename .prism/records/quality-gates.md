---
id: "quality-gates"
type: "Requirement"
title: "Professional release gates"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["quality","requirement","brief"]
relationships: ["acceptance-baseline","ci-verification","lockfile","visual-quality","security"]
---
Required before release: reproducible install, passing typecheck/test/build, Windows and Linux CI, runtime smoke tests, accessibility and reduced-motion validation, reviewed dependency audits, no ordinary-save data loss, project isolation and reviewed visual baselines. Evidence is scoped to exact revisions and environments. A status of Ready must not substitute for evidence.
