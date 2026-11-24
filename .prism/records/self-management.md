---
id: "self-management"
type: "Milestone"
title: "M0 — Prism self-management"
status: Ready
priority: "High"
accent: "teal"
tags: ["roadmap","brief"]
relationships: ["vision","self-workspace","working-agreement","lockfile","ci-verification","acceptance-baseline","release-license","typed-link-slice","ux-navigation","interaction-hit-areas","delivery-evidence","git-evidence-slice","local-verification","development-workflow-decision","navigation-stability","view-preferences"]
---
Accepted foundation milestone. Use Prism's own repository as the primary development workspace.

## Exit criteria
- Prism Development opens by default alongside Emberfall.
- Product vision, decisions, features, tasks, risks and verification evidence are navigable.
- The development backlog and review use saved views.
- Local revision-specific verification is recorded; lockfile and manual acceptance requirements are tracked explicitly.
- Future implementation changes update their corresponding records in the same reviewed change.

No release date is committed.

Owner feedback: prioritize usable information presentation and navigation before expanding the feature set. See ux-navigation.

Lockfile source-control task is complete. Selection and navigation improvements were accepted in the foundation; evidence-linked tracking continues in M1.

Hosted CI is deferred by owner decision. Local verification and focused PR review replace that gate. PR #1 is merged; development now uses short-lived branches.

The 6064d82 verification is historical; the later navigation fixes were included in the verified and accepted foundation below. The open-source license and broader release requirements remain separate work; foundation acceptance is not a public release.

## Foundation acceptance
Owner explicitly accepted foundation PR #1. Local verification passed at 859efb773d22544fed85567e01f4623d35f788d0 on Windows, Node 26.13.1: locked install, typecheck, 27 tests passed / one expected file-symlink permission skip, production build and both audits (zero vulnerabilities). Regular merge commit 156700abada6ec691e5fb0e7e4225cc2fffe9af0 has the same tree as the tested head. This is evidence of the accepted baseline, not verification of later editor changes.
