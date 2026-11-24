# Public development preview readiness

Owner selected SPDX `AGPL-3.0-only` on 2026-11-24. The full license is in LICENSE, sourced verbatim from SPDX license-list-data text/AGPL-3.0-only.txt. The npm root manifest and lockfile declare the same license. Keep private:true to prevent accidental npm publication; this does not control GitHub repository visibility.

Scope: license the copyright holders' own Prism source and project-owned material; this does not relicense third-party components or independently authored user project files. Confirm rights in contributed and example material before public release. AGPL section 13 applies to modified versions with remote network interaction; operators must provide corresponding source to interacting users as required. Do not imply a link to upstream source is sufficient for a modified hosted version.

## Preliminary dependency and file inventory

Main at a9d5ca8759ec13ff1fc37179a88368047d4eb126: 230 tracked blobs, two SVG palette fixtures; no other non-text/binary asset path identified by extension inventory. The portable registry contains relative paths. This is not a content or history privacy scan.

The npm lockfile contains 290 non-root entries (including platform variants and development dependencies), with declared licenses:
- MIT 247
- ISC 13
- MPL-2.0 12 (lightningcss and platform bindings)
- Apache-2.0 6
- BlueOak-1.0.0 6
- BSD-3-Clause 5
- 0BSD 1

This inventory is metadata, not legal clearance. Review actual installed license/NOTICE files, retained notices and MPL file-level obligations, distribution format, Rust/Bevy transitive dependencies and any copied assets. The Rust lockfile does not establish license terms. Do not create a generic NOTICE that claims all dependencies are AGPL. No third-party license changes are intended.

## Before switching visibility

- [x] Owner selects AGPL-3.0-only.
- [x] Accept and integrate the record-management increment (PR #11).
- [ ] Verify and integrate the license and public-preview preparation PR.
- [x] Owner ran Gitleaks on a fresh non-shallow mirror, with --all and redaction enabled; 44 commits scanned, about 1.15 MB, no findings, exit 0. This covers the mirrored snapshot before subsequent integration/documentation commits.
- [ ] Review hidden and ignored file boundaries, all tracked author emails and personal paths, project records, demo files, GitHub issues/PR conversations, attachments, releases and Actions logs/artifacts. Review actual remote refs and archived or deleted content separately where available. Do not paste secret values into a PR. Rotate/revoke exposed credentials before publication; removing a file at HEAD is not sufficient.
- [ ] Confirm ownership and licenses of code, documentation, examples and assets; review actual third-party notices, including Rust/Bevy. Preserve applicable notices when distributing.
- [ ] Enable private vulnerability reporting if available; review collaborator access and Actions settings. Do not use privileged pull_request_target workflows to execute untrusted code. Keep tokens read-only, no secrets passed to fork tests, no self-hosted runners for untrusted contributions.
- [ ] Owner confirms visibility change after privacy and licensing review. Public source/history cannot reliably be made private again once copied. Publish a development preview, not a stable release.
- [ ] Observe successful hosted verification on supported matrix configurations. Inspect report revision and environment. Only then adopt required checks in branch rules and reduce repeated local automated runs. Preserve focused human acceptance; no automatic merge. CI ingestion into Prism is follow-up work.

## Preliminary remote review — 2026-11-24

Read-only GitHub inspection before publication: main `a9d5ca8`, record-management head `b625b19`, public-preview head `0e36250`.

- 10 listed branches (main, two topic branches and seven Dependabot branches); no tag refs returned. Record-management history returned 38 reachable commits; this is not a scan of all branch contents or historical blobs.
- Record-management head: 244 tracked blobs, complete tree listing; no obvious secret-related filenames in a narrow filename check. The public-preview tree was also listed. These checks do not establish the absence of secrets.
- Screened titles/bodies of all 12 listed PRs and the available issue/inline-comment collections (zero returned) for common token/private-key/credential-URL/user-path/email patterns. No matches. This does not cover review submissions, attachments, deleted content, full issue metadata or logs. No releases returned.
- Screened commit messages and author/committer emails in the 38 returned record-management commits. Three email-pattern matches were GitHub service committer addresses; no author email match under this limited rule. Review author identity preferences independently.
- 22 historical Actions runs returned. Logs and artifacts have not been scanned. Review or remove sensitive historical material before changing visibility. Do not expose raw scan output in the public repository.
- LICENSE matched the official SPDX `AGPL-3.0-only.txt` text exactly at inspection. Manifest uses the same identifier. This confirms text consistency, not ownership or third-party legal clearance.
- CI source has read-only permissions, pinned action SHAs, no persisted checkout credentials and public-only automatic jobs. Actual matrix execution remains unverified.

### Owner-side full-history check (PowerShell)

Use a reviewed stable [Gitleaks release](https://github.com/gitleaks/gitleaks/releases). In a separate directory outside the development checkout, make a fresh mirror (requires repository access):

```powershell
git clone --mirror https://github.com/aschenrot/prism.git prism-publication-audit.git
Set-Location prism-publication-audit.git
git rev-parse --is-shallow-repository
git for-each-ref --format='%(refname)'
gitleaks git --redact=100 --log-opts="--all" .
$LASTEXITCODE
```

Expect a non-shallow mirror; compare refs to the repository and inspect scanner coverage/errors. A zero scanner exit code is one input to the review, not proof of privacy. Nonzero findings or errors require investigation; rotate or revoke affected credentials and remediate history if needed before publication. Review GitHub review submissions, attachments, issue/PR conversations, Actions logs/artifacts and any refs not obtained by the mirror separately. Inspect personal paths and confidential project content even if the scanner does not flag them. Do not commit the mirror or scanner reports. Keep the repository private until all outstanding checks and explicit approval are complete.

## Owner-reported history scan — 2026-11-24

Fresh mirror clone: 897 objects received, shallow repository false. `gitleaks git --redact=100 --log-opts="--all" .` reported 44 commits scanned, approximately 1,145,463 bytes, no leaks found; process exit 0. Exact mirrored ref list and scanner version were not supplied. This is owner-reported successful secret screening of that snapshot. Review new commits and refresh the mirror before switching visibility; confidential content, GitHub-hosted material and licensing review remain separate. PR #11 accepted and merged at `c96c5c728acfbcc64953d8e1e94579bd44dfcc30`. No public visibility change or hosted CI success claimed.

## Hosted CI policy

The Verify workflow triggers on PRs targeting main and pushes to main. Automatic jobs run only for public repositories, retaining explicit manual dispatch for private testing when allowance is available. Standard hosted runners are used on Ubuntu/Windows with Node 22/26; no new npm dependencies. Official actions are pinned to reviewed release commit SHAs and use read-only permissions with checkout credentials not persisted.

The same existing npm verification and isolated browser runner are invoked. Reports identify the checked-out revision: GitHub PR events usually test a synthetic merge revision, while main runs test the resulting integration revision. Do not conflate either with the topic head. Upload only local verification JSON and isolated browser outputs, retained seven days; no real project records, local acceptance runs or credentials. Storage may have separate limits. No hosted success is claimed until a run passes.

GitHub visibility remains unchanged until the owner completes the readiness review.

## Observed publication outcome — 2026-11-24
Owner approved rights/notices and confidentiality/GitHub-hosted review and public visibility. Owner reported both local verification gates and refreshed redacted Gitleaks scan passed (44 commits, exit 0, no leaks). PR #12 merged at c031ea43a68cbbebed3844f3dfb7fd342b9ecdfa; tree identical to verified candidate. Public visibility confirmed. The original checklist records the pre-publication policy; this section supersedes its historical pending visibility/approval entries. No independent legal clearance or separate merge-diff scan result claimed. First public [Verify run](https://github.com/aschenrot/prism/actions/runs/45366557015) failed on all four configurations; do not adopt required checks as replacement for local gates until corrective verification succeeds.
