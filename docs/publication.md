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
- [ ] Review and integrate the license and public-preview preparation PR, and accept the record-management increment.
- [ ] Fetch all branches/tags and scan complete reachable Git history for secrets using a reviewed secret scanner (for example Gitleaks with redacted output). Review hidden and ignored file boundaries, all tracked author emails and personal paths, project records, demo files, GitHub issues/PR conversations, attachments, releases and Actions logs/artifacts. Review actual remote refs and archived or deleted content separately where available. Do not paste secret values into a PR. Rotate/revoke exposed credentials before publication; removing a file at HEAD is not sufficient.
- [ ] Confirm ownership and licenses of code, documentation, examples and assets; review actual third-party notices, including Rust/Bevy. Preserve applicable notices when distributing.
- [ ] Enable private vulnerability reporting if available; review collaborator access and Actions settings. Do not use privileged pull_request_target workflows to execute untrusted code. Keep tokens read-only, no secrets passed to fork tests, no self-hosted runners for untrusted contributions.
- [ ] Owner confirms visibility change after privacy and licensing review. Public source/history cannot reliably be made private again once copied. Publish a development preview, not a stable release.
- [ ] Observe successful hosted verification on supported matrix configurations. Inspect report revision and environment. Only then adopt required checks in branch rules and reduce repeated local automated runs. Preserve focused human acceptance; no automatic merge. CI ingestion into Prism is follow-up work.

## Hosted CI policy

The Verify workflow triggers on PRs targeting main and pushes to main. Automatic jobs run only for public repositories, retaining explicit manual dispatch for private testing when allowance is available. Standard hosted runners are used on Ubuntu/Windows with Node 22/26; no new npm dependencies. Official actions are pinned to reviewed release commit SHAs and use read-only permissions with checkout credentials not persisted.

The same existing npm verification and isolated browser runner are invoked. Reports identify the checked-out revision: GitHub PR events usually test a synthetic merge revision, while main runs test the resulting integration revision. Do not conflate either with the topic head. Upload only local verification JSON and isolated browser outputs, retained seven days; no real project records, local acceptance runs or credentials. Storage may have separate limits. No hosted success is claimed until a run passes.

GitHub visibility remains unchanged until the owner completes the readiness review.
