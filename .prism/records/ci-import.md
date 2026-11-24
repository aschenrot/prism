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
