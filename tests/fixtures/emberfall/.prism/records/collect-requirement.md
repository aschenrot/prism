---
id: collect-requirement
title: "Collect each fragment once"
type: Requirement
status: In progress
priority: High
accent: amber
tags: ["acceptance","gameplay"]
relationships: ["core-loop","exploration-system","collection-test"]
---
Acceptance: approaching a fragment collects it; revisiting it does not increase the count. Implementation: src/lib.rs, advance. Test: tests/exploration.rs, fragments_cannot_be_counted_twice.
