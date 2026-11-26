---
id: m1-native-project-settings
type: Task
title: Manage project settings without terminal commands
status: In progress
priority: High
accent: teal
tags: [current, usability, configuration]
relationships:
  - kind: implements
    target: project-settings
  - m1-native-workspace-creation
  - m1-product-quality-corrections
  - m1-functional-verification
  - m1-milestone-acceptance
---
## Outcome
Manage names, visible product/game navigation and optional GitHub association directly in Prism. Preserve all unexposed profile values, project IDs, storage, roots and existing records.

## Acceptance criteria
- Revision-bound settings read/update, cooperative registry lock and full running configuration comparison. Reject external registry changes and explicit overrides without publishing a change.
- No path, identity or storage mutation in the API. No outbound GitHub requests from changing an association. Clearing the association is explicit.
- Graphical settings retain unsaved input on failure, prevent unsafe navigation and preserve current project selection. If an active category is disabled, move to Overview. Reopen/restart confirms saved values.
- Tests cover preserved store identity and records, stale settings, external configuration, explicit overrides, unsupported root/association changes and actual browser behavior. Exact CI and visual review before integration.
- External folder connection, relocation and unregistration remain separate.


## First-use follow-up
The verified workspace creation screenshot demonstrated an empty dashboard dominated by missing-state reports. A genuinely empty, successfully loaded project should instead offer direct paths to Inbox, Work, Documentation and Strategy when applicable. Never show this state if record loading is incomplete. The existing native creation browser scenario verifies the empty state and its Inbox entry point.
