---
id: m1-filesystem-hardening
type: Task
title: Enforce project isolation and interrupted-backup safety at startup
status: In progress
priority: High
accent: rose
tags: [quality, reliability, security]
relationships: [data-integrity, local-project-registration, local-project-backups, m1-milestone-acceptance]
---
M1 closure audit found a bypass of the local registration data-root validation in manual registries and a partially copied backup directory without a manifest could be mistaken for a writable project. Preflight all registry sources before initializing stores and mark incomplete backup copies before writing data; refuse opening, verification and restore until completion. Preserve existing valid configuration and nested repository roots with disjoint stores. Add isolated regression coverage. Owner K15/K16 review remains pending.

Integration evidence: PR #34 merged at `45cca9e89c128aafdbc95fe3b8d8ea7f05a7a3d3`. [Verify 45485147519](https://github.com/aschenrot/prism/actions/runs/45485147519): all four configurations passed 99 unit and 34 browser scenarios each, zero failures/skips/flakes, both audits zero vulnerabilities, clean eligible evidence at checkout `efe921bd6d596ad2211d8d01c759d8c17f9d138b`, tree `3fa189d5e09fa7c4e2696ebb03789b41328061c7` matches merged main. Human K15/K16 acceptance remains pending.
