---
id: ux-navigation
type: Feature
title: Purpose-driven workspace navigation and overview
status: Ready
priority: High
accent: teal
tags: [current, design, usability]
relationships:
  - kind: implements
    target: visual-quality
  - self-management
  - self-workspace
implementationCommits: ["b0bcb3fd03dc5817b002eecdffe2a95f49114932"]
---
Owner feedback: current information presentation and navigation are confusing. Replace record-type-first navigation with project-purpose destinations and context-specific view choices. Keep the underlying canonical data, typed relationships and saved views.

## Acceptance criteria
- Start on a live overview with objectives, active milestones, explicitly tagged blockers and tasks; distinguish record audit findings from release health.
- Product and game profiles expose appropriate sections; standalone projects do not expose repository browsing.
- Work and roadmap open relevant collections; view modes are limited to appropriate choices.
- All records and custom views remain reachable through Data library and Saved views.
- Open a record and expand/collapse the existing editor without losing changes.
- Switch project and confirm navigation changes appropriately; validate keyboard navigation and responsive layout.

Implementation: shared/navigation.ts, src/WorkspaceOverview.tsx, src/App.tsx and src/styles.css. Tests: tests/navigation.test.ts. No runtime screenshots or usability testing have yet been performed. Custom navigation configuration, dedicated entity editors, search palette and design-system refinement remain follow-up work.

Implementation committed: b0bcb3fd03dc5817b002eecdffe2a95f49114932. Owner feedback after launch: the project selector and table records are difficult to select except on particular sub-elements. This is evidence of use and a specific usability issue, not full acceptance. See interaction-hit-areas. Verify the new implementation with keyboard and pointer before closing this feature.

Owner reports brief flashes of another view during category changes after successful automated verification at 6064d82. Track the fix in navigation-stability; browser reproduction and acceptance remain required.

Owner requested consistent visualization tab ordering. Implement canonical relative order and local per-project/category mode preferences; see view-preferences. Saved views remain authoritative for their configured mode. No acceptance inferred from implementation.

## Foundation acceptance
Owner explicitly accepted foundation PR #1. Local verification passed at 859efb773d22544fed85567e01f4623d35f788d0 on Windows, Node 26.13.1: locked install, typecheck, 27 tests passed / one expected file-symlink permission skip, production build and both audits (zero vulnerabilities). Regular merge commit 156700abada6ec691e5fb0e7e4225cc2fffe9af0 has the same tree as the tested head. This is evidence of the accepted baseline, not verification of later editor changes.
