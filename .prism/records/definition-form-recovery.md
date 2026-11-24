---
id: definition-form-recovery
type: Task
title: Recovery of unfinished schema entity and template forms
status: In progress
priority: High
accent: teal
tags: [editing, reliability, knowledge]
relationships:
  - kind: implements
    target: editing-reliability
  - property-schema-management
  - record-templates
  - recovery-workspace
  - m1-milestone-acceptance
---
Versioned browser-local draft envelopes per project and definition kind. Validate intermediate input without trimming or requiring complete definitions. Explicit resume, keep and close, export and discard; compare the last observed local token, retain current input on competing storage changes. Resume through existing revision-checked definition commands; no automatic canonical writes. Recoverable form input is not a durable backup or cross-device draft. Human K19 pending.

Initial run 45481262057: inspected Ubuntu Node 26 log shows 33 existing scenarios passed, new K19 scenario restored the template name but exact Default body label did not resolve after resume. Give textarea an explicit accessible name and retain the exact value assertion; fresh matrix required. This is a locator observation, not proof of restored body content until the corrected test passes.

Integration evidence: PR #33 merged at `6ba5202d59afaba35c1ba621330c2a8a848ababb`. [Verify 45484388759](https://github.com/aschenrot/prism/actions/runs/45484388759): all four configurations passed 97 unit and 34 browser scenarios each, zero failures/skips/flakes, clean exact checkout and zero audit vulnerabilities. Human acceptance remains pending.
