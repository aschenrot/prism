---
id: public-preview-readiness
type: Task
title: AGPL public development preview and automatic verification
status: In progress
priority: High
accent: teal
tags: [current, release, security, quality]
relationships:
  - release-license
  - ci-verification
  - security
  - quality-gates
  - self-management
  - development-workflow-decision
---
Owner selected AGPL-3.0-only and wants public standard hosted CI to reduce manual verification. Prepare license, contribution/security documentation and automatic public PR/main verification, without changing visibility or accepting the current record-management PR. Public readiness requires owner review of complete history, sensitive GitHub metadata/logs, asset and code rights, npm/Rust license obligations and security settings. Use docs/publication.md as the checklist; do not claim a clean history or successful hosted checks without evidence. After review and explicit publication approval, observe actual hosted runs before requiring CI and reducing repeated local verification. No automatic merging.
