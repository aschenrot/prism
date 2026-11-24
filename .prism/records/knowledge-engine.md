---
id: "knowledge-engine"
type: "Milestone"
title: "M1 — Configurable knowledge and management"
status: "In progress"
priority: "High"
accent: "teal"
tags: ["roadmap","current","brief"]
relationships: ["self-management","custom-schemas","typed-relationships","editing-reliability","project-settings","management-views","search-index","draft-recovery","editor-acceptance","record-navigation","acceptance-workspace","browser-verification","collection-interaction"]
---
Dogfood requirements before extending the generic engine. Support custom entity schemas, typed relationships, schema-driven editors, templates, inbox, richer search, persistent edits and project management views. Acceptance: a requirement linked to an objective and task is edited once and updates relevant views; old records remain valid or migrate explicitly.

Active milestone after foundation acceptance. First priority: safe draft recovery and explicit conflict resolution.

PR #9 accepted and merged. Current increment: collection-interaction; review via collection-acceptance after local verification.

Owner feedback prioritizes full record pages, functional breadcrumbs and native history before further editor features. See record-navigation; acceptance is integrated into the current PR because the existing editor review depends on this workflow.

The acceptance-workspace task separates test definition from revision-bound local execution; native review and motion are now part of the current PR's acceptance scope.

Owner feedback prioritizes Cancel, non-blocking notifications, local browser regression and evidence handoff. Browser-verification initial slice is accepted. Collection-interaction is active. Manual UX review is now separate from the technical regression specification.

Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.
