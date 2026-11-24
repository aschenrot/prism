---
id: "knowledge-engine"
type: "Milestone"
title: "M1 — Configurable knowledge and management"
status: "In progress"
priority: "High"
accent: "teal"
tags: ["roadmap","current","brief"]
relationships: ["self-management","custom-schemas","typed-relationships","editing-reliability","project-settings","management-views","search-index","draft-recovery","editor-acceptance","record-navigation"]
---
Dogfood requirements before extending the generic engine. Support custom entity schemas, typed relationships, schema-driven editors, templates, inbox, richer search, persistent edits and project management views. Acceptance: a requirement linked to an objective and task is edited once and updates relevant views; old records remain valid or migrate explicitly.

Active milestone after foundation acceptance. First priority: safe draft recovery and explicit conflict resolution.

Current acceptance gate: editor-acceptance (PR #9). Complete verification and owner review before merging the draft recovery slice.

Owner feedback prioritizes full record pages, functional breadcrumbs and native history before further editor features. See record-navigation; acceptance is integrated into the current PR because the existing editor review depends on this workflow.
