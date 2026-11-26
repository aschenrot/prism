---
id: m1-native-workspace-creation
type: Task
title: Create standalone workspaces directly in Prism
status: In progress
priority: High
accent: rose
tags: [current, blocker, usability, filesystem]
relationships:
  - kind: implements
    target: project-settings
  - kind: implements
    target: data-integrity
  - project-registry
  - local-project-registration
  - m1-product-quality-corrections
  - m1-milestone-acceptance
  - m1-functional-verification
---
## Outcome
Create a new standalone workspace from the project selector with a name and useful profile, without terminal commands or restarting. Use a fixed ignored managed storage root under the Prism launch directory. Keep external folder grants, removal, relocation and settings mutations separate.

## Acceptance criteria
- Strict title/profile/UUID request validation, no arbitrary path or caller-provided storage mode. Stable request-derived ID and directory, exclusive creation, reject links, overlapping stores, explicit overrides and externally changed registries.
- Initialize stores before registry publication; preserve existing projects and portable registry; on uncertain failure leave unregistered data untouched. Retry identical successful request without creating another workspace.
- Live project selection updates after successful creation, reload/restart preserves registered data, new workspace starts empty and independent. Failure retains entered choices. Dirty editor or pending operation blocks creation/navigation.
- Developer-owned tests in localRegistry.test.ts and workspace.spec.mjs. Exact candidate and integrated CI evidence required; owner product review remains open.
- Existing/manual project ID remapping, complete graphical project settings, backup/restore and external folder connection remain follow-up. No new external access.
