---
id: delivery-increment-scope
type: Task
title: Explicit delivery increments and revision-aware evidence
status: In progress
priority: High
accent: teal
tags: [current, management, delivery]
relationships:
  - kind: implements
    target: delivery-evidence
  - record-management-increment
  - record-actions-acceptance
  - knowledge-engine
  - quality-gates
---
Add Increment record type and explicit Contains relationship with milestone-to-increment and increment-to-task/test endpoint constraints. Generic relationships do not imply membership. Scope projection reports missing/invalid members and distinct task status, linked commit counts and acceptance evidence. Overview and milestone expose increments; detail panel separates authored status, implementation evidence, project-wide local npm/browser reports and exact revision/definition acceptance. Newer open or changes-requested run supersedes older accepted run. Historical reports remain visible, not current proof. Standalone projects can use explicit scope without requiring Git. No automatic workflow transition or GitHub status integration. Browser report reader validates strict bounded JSON and derives eligibility from clean revision, actual counts and exit codes. Use the real PR #11 increment as first dogfooding record. Unit/browser coverage written; verification pending.
