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

## Required checks adopted
Owner corrected Protect Main on 2026-11-24. Direct ruleset read confirms all four named Actions checks required, strict base policy, no bypass actors, deletion/non-fast-forward and PR rules retained, required-linear-history removed. PR #13 integrated at 1678976837e836bfc0096f1cd8cae35c692c82e6; main run 45390756019 passed all four jobs. PR #14 then synchronized and passed required run 45390802441 (59/59 unit, 17/17 browser each; exact synthetic SHA 38ca4ce09feaa57eb6de2560b7ddb16ad1cf430a). Merged 146b5da82dc8213ad2ab821b41d446dcd2135111, identical tree. Main post-merge CI tracked separately. Delegated in-scope technical integration now operational. Human milestone acceptance still pending.

## Subsequent integrated baseline
PR #15 merged preserving the verified tree at 34b8c2cc8c865ece6279ada09e8bd247ffbc1a36. Required matrix run 45391421549, synthetic checkout 3a915503b73e1353aebbb9ec97f93941b808ff07, inspected all four logs: 63 unit tests and 18 browser scenarios each, all passed; clean eligible evidence, zero skips/flakes/failures, both audits zero vulnerabilities. Main run 45391844584 completed successfully across all four jobs. Current M1 schema increment starts from this main revision.

PR #16 integrated at 5a09cfa376e31d82350de225bb7a18efa895ee39 after full required matrix 45453922493 passed (67 unit / 19 browser each; tested checkout 92a7bdb658c28e4c34355cd24235842b693c1e11, identical tree). First run cancelled after observed accessible label regression; corrected without weakening tests. Main verification separate.

Main run 45454428447 passed after PR #16. PR #17 integrated 007d4ede8d6f38185e8e07a0fa5074e33caa21f7 after full required run 45455067554 (69 unit / 20 browser each; checkout 3731e6585caad579b697969a93a3aec2e0f77279, identical tree). First run superseded after missing configuration navigation; corrected shared group contract and retained browser coverage. Main verification separate.


Technical integration: PR #18 merged at 0bde5bbe1d183e6e8a902a917ef1fcdf60b14fe6; run 45456348459 passed all four hosted configurations, 72 unit and 21 browser scenarios per job at checkout df2540420c14fff4902519d061416829e77b085f, identical tree to proposed head 99a4fe4d672af4c0a84e5d3b2b8da5c15721da53. No failed, flaky or skipped tests; clean start/end, eligible evidence, zero reported audit vulnerabilities. Initial run 45455789198 failed an ambiguous navigation locator; fixed by selecting the intended sidebar. Human K05 acceptance remains pending.

Technical integration: PR #19 merged at 2bd43b77021ad0be9cb424e1b79501caea7acbd1; final run 45457077297 passed all four hosted configurations, 75 unit and 22 browser scenarios per job at checkout 06f48aaab15aa39642f8bd43dd4c8172a3ca521d, identical tree to head d5dae9638d01a6905c009c7ce859282b842c1ac2. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K06 acceptance pending.

Technical integration: PR #20 merged at d2dfe3c3ed126e413a3132678bea2d9a6f977fba; final run 45457808408 passed all four hosted configurations, 77 unit and 23 browser scenarios per job at checkout 6f512390ad05cbc5dbf069f8d0de13e1b531da8a, identical tree to head bdfbef19dd2dea711fc89eb3f3f716ef41a6ec09. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K07 acceptance pending.