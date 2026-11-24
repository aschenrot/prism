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
