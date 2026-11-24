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

Preliminary remote inspection on 2026-11-24 recorded in docs/publication.md: current branch inventory, limited metadata/filename screening, exact SPDX text comparison and CI source review. Full-history scanner, historical Actions logs/artifacts, third-party actual notices and owner rights/privacy review remain outstanding. PR #11 head and acceptance state were left unchanged.

Owner reported a fresh non-shallow mirror Gitleaks scan on 2026-11-24: 44 commits, approximately 1.15 MB, no leaks, exit 0. PR #11 accepted and merged at c96c5c728acfbcc64953d8e1e94579bd44dfcc30. Final candidate verification, refreshed scan of subsequent changes, historical Actions metadata/logs, rights/notices and owner publication approval remain pending.

## Publication outcome
Owner confirmed both local gates at f24b429c5301aa13e0fce02d71b884e2ad61a7f0, refreshed mirror Gitleaks scan (44 commits, no leaks, exit 0), source/asset rights, third-party obligations and confidential/GitHub material review, and explicitly approved merge and visibility. See [PR #12](https://github.com/aschenrot/prism/pull/12). Merged at c031ea43a68cbbebed3844f3dfb7fd342b9ecdfa with identical file tree to tested head. Public visibility directly confirmed on 2026-11-24. No independently retrieved local reports or separate merge-diff scanner output. First hosted run 45366557015 failed on all four configurations; see ci-verification for failure evidence and corrective work. Public preview is published, but hosted CI adoption remains open; do not mark the combined task Ready yet.
