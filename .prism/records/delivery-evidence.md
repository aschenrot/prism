---
id: delivery-evidence
type: Feature
title: Evidence-linked work status and change reconciliation
status: Concept
priority: High
accent: amber
tags: [current, product, quality, management]
relationships:
  - git-intelligence
  - ci-import
  - self-management
  - quality-gates
---
Owner feedback: task and project status fall out of sync after implementation commits. The present workflow has only Concept, In progress and Ready. It cannot distinguish implementation committed from awaiting review, blocked verification or accepted work.

## Proposed direction
Keep authored workflow status separate from derived delivery evidence. Associate commits and PRs with stable record IDs using explicit commit trailers; read Git history without changing it. Display implementation revision, verification result and coverage scope independently. A passed CI run for an old revision is historical evidence, not proof of a later change. Unlinked commits and incomplete evidence should be visible for reconciliation, not silently guessed. Use explicit review transitions and record acceptance evidence before marking complete. A milestone derives progress from its explicitly scoped tasks and acceptance gates, not every generic link or commit count.

Acceptance: after a task-linked commit, Prism can display implementation evidence without requiring duplicate progress entry; after verification, show its actual revision and outcome. Preserve manual acceptance decisions. No automated task completion from commit counts or AI guesses. No GitHub write access is required to read local history; optional CI integration may supply evidence later.
