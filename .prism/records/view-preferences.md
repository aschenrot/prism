---
id: view-preferences
type: Task
title: Consistent view controls and local preferences
status: In progress
priority: High
accent: teal
tags: [current, design, usability]
relationships:
  - kind: implements
    target: ux-navigation
  - navigation-stability
  - visual-quality
  - self-management
---
Owner feedback: the Wiki, Table and Relationships controls change order between destinations. Use one canonical relative order independent of default selection. Remember explicit view changes for each registry project and destination, without mutating authored saved views or project data.

## Acceptance
- Table, Board, Gallery, Wiki, Relationships, Slides follow one global relative order. Only supported modes are shown. Audit follows common record modes when offered.
- A first visit uses the destination default even when it is not the first tab.
- Select Table in Requirements, navigate away, return: Table remains selected. Documentation has an independent preference.
- Reload or restart in the same browser origin/profile; explicit preferences persist. Projects with distinct registry IDs remain independent.
- Saved views always open in their authored mode. Changing their transient visualization does not overwrite ordinary Data library preferences.
- Unavailable, invalid or outdated storage values do not break navigation; defaults or session memory remain usable.
- Preserve atomic navigation and dirty record editor state.

Implementation: shared/navigation.ts, src/viewPreferences.ts, src/App.tsx. Tests: tests/navigation.test.ts and tests/view-preferences.test.ts. Runtime verification pending. Browser preferences are scoped by origin and registry project ID; not shared across machines or different origins. Only mode preference is persisted, not filters or active destination.
