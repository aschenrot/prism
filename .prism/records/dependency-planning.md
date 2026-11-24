---
id: dependency-planning
type: Task
title: Explicit dependency planning and cycle visibility
status: In progress
priority: High
accent: amber
tags: [management, planning]
relationships:
  - management-views
  - knowledge-engine
  - m1-milestone-acceptance
---
Plan mode for Work, Roadmap, Increments and Data library. Normalize depends-on and blocks into directed prerequisite edges, deduplicate equivalent assertions, display direct known and unavailable prerequisites/dependents, flag exact strongly connected cycle members, and preserve links outside current filters. No inferred relationships, transitive scheduling or automatic status changes. Ready means authored status, not acceptance. Plan supports normal filtering, stable links and saved views. Tests include edge direction, cycles, long graph, project context and browser navigation. Owner K11 pending.


Verification audit: run 45465291849 passed all jobs and the new browser scenario, but unit count stayed 79 instead of increasing to 81. Inspection identified the new graph tests had accidentally replaced the existing dependency-policy tests in tests/dependencies.test.ts. Restore the original file exactly and move graph tests to tests/dependencyPlan.test.ts. Require fresh full verification with both old and new tests; do not merge the earlier green tree.


PR #24 integrated at `c561623a8e09831d9012e95c2ed85d081e5b403f`. Corrected full matrix [45466176701](https://github.com/aschenrot/prism/actions/runs/45466176701): 81 unit + 27 browser tests passed on each of four configurations, both legacy regression tests restored, zero reported audit vulnerabilities. Verified checkout `b511da2928f54eb903f924224e5d354afdadb695` had identical tree to PR head. K11 human review pending.
