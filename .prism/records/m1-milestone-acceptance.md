---
id: m1-milestone-acceptance
type: Test
title: Milestone acceptance — configurable knowledge and management
status: In progress
priority: High
accent: teal
tags: [acceptance, quality, milestone]
relationships:
  - knowledge-engine
  - hosted-delivery-increment
  - hosted-workflow-metadata
  - hosted-pr-association
  - quality-gates
---
## Review instructions
Owner-approved consolidated M1 product review. Do not execute as final until the complete milestone scope is delivered and verified on the exact candidate. Review definition evolves as increments add concrete capabilities; do not mark cases passed before observations. Existing accepted historical reviews remain historical. Automated CI evidence and human product acceptance are distinct. Use disposable isolated projects/records, never destructive operations on live project data. Record environment, exact revision, observations and explicit final decision. Escalate consequential issues before the final review if necessary.

## H. Hosted delivery evidence
- [ ] H01 — **Read hosted workflow metadata** — Open Quality for the configured Prism repository, request GitHub runs, follow one run and associated PR link, and inspect the reported head and observation time. Expected: intentional lookup, clear source and provider state, useful links, no implication that a PR head proves its checkout or that CI proves manual acceptance.
- [ ] H02 — **Keep remote evidence separate** — Switch to a repository project without GitHub configuration, return to Prism, and inspect local evidence alongside hosted results. Expected: no accidental lookup or project leakage, clear unavailable state, independent local evidence and authored planning status, no automatic completion.

- [ ] H03 — **Inspect scoped pull requests and jobs** — Open an increment with an authored repository-qualified PR reference, request PR metadata and associated runs, load one selected run's job details, and compare reported head and attempt. Expected: only explicit associations, independently observed status, clear partial/unavailable states, no suggestion that provider-reported head is the actual checkout or that a green job establishes record acceptance.

## R. Record management and reliability
- [ ] R01 — **Navigate and sort consistently** — Open record menus from Table, Board and record pages; navigate between collection and record, scroll and use keyboard controls. Sort the table in both directions. Expected: usable focus and pointer targets, menu remains anchored while visible, stable column geometry, predictable dismissal and preserved context.
- [ ] R02 — **Protect authored changes** — Edit disposable records, exercise recovery, conflict review, cancel, duplicate and reversible trash. Expected: no silent overwrite or loss; independent copies and preserved links; clear save/recovery state.

## K. Knowledge and project management
- [ ] K01 — **Edit a linked requirement once** — In a disposable project, connect an objective, requirement and task and edit the requirement through the supported editor. Expected: one canonical record updates the relevant views; existing records remain valid or migrate explicitly.
- [ ] K02 — **Find and manage work** — Review the final M1 schema, search, template, inbox and management-view capabilities using the delivered product workflows. Expected: cohesive workflows with clear scope, accessible interaction and no duplicate source of truth. Refine concrete cases as the corresponding increments are implemented.
