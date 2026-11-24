---
id: navigation-stability
type: Task
title: Stabilize category and view transitions
status: In progress
priority: High
accent: teal
tags: [current, design, usability]
relationships:
  - kind: implements
    target: ux-navigation
  - self-management
---
Owner reports a brief flash of Table or another view before the destination settles. Source inspection found separately stored destination, mode and filters, globally ordered mode tabs, a lazy-loaded entire knowledge shell, and knowledge focus keyed only by mode. React normally batches synchronous updates, so the exact rendered flash has not been reproduced and its cause is not established.

Implementation: atomic navigation snapshot; mode tab order follows destination definition; synchronous Knowledge shell with lazy Markdown body only; key knowledge focus by destination and saved-view identity; stable scrollbar gutter. No intentional table fallback or artificial delay. Preserve dirty inspector state. Regression test covers atomic state and contextual modes. Manual acceptance: switch repeatedly between Work, Requirements, Strategy, Documentation, Decisions, Architecture and saved views on fresh and warm loads; ensure correct selected mode, no unrelated table or old record, no lateral layout jump. Test with clean and dirty inspector. Browser validation pending.

Follow-up: destination-first ordering is superseded by one canonical relative mode order, while default selection remains independent. View preference is resolved before the atomic navigation snapshot is set. See view-preferences. Browser verification remains open.
