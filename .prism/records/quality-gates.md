---
id: "quality-gates"
type: "Requirement"
title: "Professional release gates"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["quality","requirement","brief"]
relationships: ["acceptance-baseline","local-verification","lockfile","visual-quality","security"]
---
Required before release: reproducible install, passing typecheck/test/build, local revision-specific automated verification on the active development platform, runtime smoke tests, accessibility and reduced-motion validation, reviewed dependency audits, no ordinary-save data loss, project isolation and reviewed visual baselines. Evidence is scoped to exact revisions and environments. A status of Ready must not substitute for evidence.

Hosted CI is optional. Check supported platforms locally before claiming compatibility or releasing for those platforms. Require local automated checks and manual runtime/interaction acceptance for merging; report the exact revision, environment and limitations. No requirement for paid infrastructure.
