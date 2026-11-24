---
id: "ci-import"
type: "Feature"
title: "Local and optional CI verification evidence"
status: "In progress"
priority: "Normal"
accent: "amber"
tags: ["product","quality"]
relationships: ["repository-intelligence","local-verification","ci-verification"]
---
Import actual build, test, coverage, licensing and security results with provenance. Later support Rust nextest, Clippy, cargo-deny and llvm-cov reports. Keep evidence distinct from planning status and track the exact tested revision.

First slice: read local npm verification JSON in Quality; actual runtime acceptance pending. Hosted CI adapters are optional. Coverage, test counts, per-task verification, PR history and durable evidence exchange are not implemented.

## Hosted metadata slice
Implement the first public GitHub Actions lookup in Quality/Audit, explicitly configured per repository project and initiated by the user. Use anonymous bounded GETs to the fixed GitHub API, no arbitrary URLs, redirects, tokens, automatic polling or writes to project data. Show recent run IDs, provider state/conclusion, reported head, event, attempt, timestamp and associated PR numbers. Distinguish a PR's reported head from its checked-out synthetic merge revision. Metadata success is not an independently verified job/artifact report. Local evidence remains separate. Unit and isolated browser coverage are prepared; hosted verification pending. See hosted-workflow-metadata and hosted-delivery-increment. Subsequent slices: explicit record-to-PR association, matrix job/checked-out revision evidence and historical rollups.
