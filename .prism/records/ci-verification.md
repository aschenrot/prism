---
id: "ci-verification"
type: "Task"
title: "Automatic hosted verification for public preview"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["current","quality"]
relationships: ["quality-gates","lockfile","acceptance-baseline"]
---
Inspect the actual GitHub Actions runs and logs; earlier runs failed. Local success does not establish CI success. Require typecheck, unit/integration tests, build and security audit on supported Windows/Linux Node combinations. Use npm ci after lockfile baseline. Record check URLs and the tested revision.

2026-11-24: run 45325390198 at bb3d0f0 reports all four matrix jobs failed. The job steps are empty and the log endpoint for job 138213624100 returns BlobNotFound; the root cause is not established. Link: https://github.com/aschenrot/prism/actions/runs/45325390198. Strict npm ci is now configured. Inspect the next actual run; do not infer a successful build from a workflow edit.

Latest observed: run 45327506174 at b0bcb3fd03dc5817b002eecdffe2a95f49114932 reports failure for all four OS/Node matrix jobs, with no step details returned in the job summaries. Root cause still unknown. https://github.com/aschenrot/prism/actions/runs/45327506174

Acceptance includes clean npm ci from the committed lockfile on Windows and Linux, passing typecheck/test/build and security audit. This is separate from the completed lockfile commit task.

Observed run 45329516315 at bdfa7d32989b313b7fcf23bb294610527262c43c reports failure. No new successful CI result established. https://github.com/aschenrot/prism/actions/runs/45329516315

## Policy superseded
Owner reports exhausted hosted CI allowance for the private repository. Hosted CI is optional, deferred and not a release blocker. Automatic push and PR triggers are removed; manual workflow dispatch remains available if allowance returns. Previous observations above are historical, not a required gate. See local-verification and development-workflow-decision for the replacement policy.

## Public preview follow-up
Owner wants to make source public to reduce manual verification burden. Automatic public PR/main triggers are configured; private automatic jobs remain skipped, with manual dispatch available. Matrix uses Ubuntu/Windows Node 22/26 and existing npm and isolated Chromium verification. Pinned actions, read-only token and seven-day fixture artifacts. Actual hosted run and required-check adoption remain pending. Historical private CI failures above are not superseded by a workflow edit. See docs/publication.md and public-preview-readiness.

## First public matrix — 2026-11-24
Repository public, PR #12 merged at c031ea43a68cbbebed3844f3dfb7fd342b9ecdfa. [Run 45366557015](https://github.com/aschenrot/prism/actions/runs/45366557015) completed with four failed configurations. Ubuntu Node 22/26: npm verify passed (54 tests); browser 15/16 passed, both timed out at the Edit menu item becoming invisible after collection-to-record navigation. Windows Node 22/26: 52/54 tests passed; repository file reads rejected valid fixtures at the realpath containment check; browser not executed. Checkout, setup and evidence uploads succeeded. Root-path alias mismatch and scroll-triggered popover dismissal are source-supported hypotheses, not yet confirmed by rerun. Correct on fix/hosted-verification: canonicalize trusted root before containment and segment traversal, preserve nested link/traversal rejection, reposition open record menus on scroll (close when anchor leaves viewport), and add regression assertions. No dependency, timeout or retry changes. Require full hosted matrix and focused interaction review before integration or required-check adoption.

## Corrective run 45375296164
At PR #13 head 3f8f043ba14b417a1fbe53a11552a6b856f3637a (browser checked-out merge revision e79ee60736d06fd0df9193619df8c2c60385a340), all four npm gates passed; Ubuntu Node 22 and 26 passed the full browser suite, Windows Node 22 and 26 each passed 15/16. The previous repository and menu regressions passed in all four configurations. Windows failed the second exact header-geometry equality assertion in the sorting test: the Delivery column grew from 120.6 to 148.0 px while other columns shifted, despite constant total width. Source uses automatic table layout with asynchronous delivery labels and row-dependent intrinsic widths. Replace it for record tables with explicit colgroup geometry and fixed layout, flexible title column, minimum table width and wrapping for variable evidence text. Correct the accidental 160px minimum on the selection column. Strengthen the original exact geometry test with sorted-order and changing delivery text assertions; do not weaken equality, change retries, skip scenarios or dependencies. New matrix required. https://github.com/aschenrot/prism/actions/runs/45375296164

## First successful public matrix
[Run 45378705316](https://github.com/aschenrot/prism/actions/runs/45378705316), PR #13 head ee102b756f9b44798abd7657bab6632059e01109, synthetic merge revision 6f6682a338b2d23bf7119ae7835abe327d39a96a (identical tree): directly inspected logs for all four Ubuntu/Windows Node 22.23.5/26.13.1 jobs. All passed 55/55 unit tests and 16/16 browser scenarios, typecheck, production build and both audits (zero vulnerabilities reported). No failed, skipped or flaky tests; browser report eligible on clean unchanged checkout. Owner approved delegated M1 integration, human acceptance deferred. Integration rejected with HTTP 405; active Protect Main ruleset requires linear history, repository allows only merge commits. No bypass attempted. Required-check adoption and post-merge main run remain pending. See development-workflow-decision.
