---
id: knowledge-workflow-increment
type: Increment
title: Knowledge discovery, templates and capture
status: In progress
priority: High
accent: teal
tags: [delivery, management]
githubPullRequests: [{repository: aschenrot/prism, number: 20}, {repository: aschenrot/prism, number: 21}, {repository: aschenrot/prism, number: 22}, {repository: aschenrot/prism, number: 32}]
relationships:
  - knowledge-engine
  - search-index
  - custom-schemas
  - kind: contains
    target: project-search
  - kind: contains
    target: record-templates
  - kind: contains
    target: inbox-capture
  - kind: contains
    target: m1-milestone-acceptance
---
Project-wide saved-data search, reusable record templates, canonical inbox capture and reversible triage. Review K07–K09. Search uses bounded canonical reads; no persistent index until measurements justify it.

Explicit scope and repository-qualified PR associations are authored planning data. PR status, current checks and human review must be observed independently. This shared Test record is the consolidated M1 review, not independent acceptance of each increment. No status change from CI.
