---
id: "typed-relationships"
type: "Feature"
title: "Typed relationships and traceability"
status: "In progress"
priority: "High"
accent: "amber"
tags: ["product","knowledge"]
relationships: ["knowledge-engine","knowledge-navigation","management-views","typed-link-slice"]
---
Add typed edges such as implements, verifies, depends-on and blocks, with explicit direction, inverse display and endpoint constraints. Migrate untyped IDs losslessly. Acceptance: follow a requirement to implementation evidence and verification without inferring test coverage from generic links.

## First implementation slice
- Preserve old string IDs as generic related-to links without rewriting or inferring their meaning.
- Support explicit implements, verifies, depends-on, blocks, documents and related-to objects with a single canonical target.
- Display outgoing labels and inverse backlinks. Filter editor choices by endpoint type and surface invalid external edits in Audit.
- Keep typed and generic links distinct, including when they reference the same record.
- Test mixed persistence, invalid endpoints, backlinks and metadata preservation using isolated fixtures.

Acceptance pending: run typecheck, tests and build; create a typed link in Prism, reload, inspect the inverse label and verify old projects still open. A verifies link is an authored claim, not proof of test execution. Custom relationship vocabularies, cycle analysis, traceability matrices and evidence integration remain later work.
