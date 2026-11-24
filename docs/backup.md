# Local project backup and restore

Stop Prism and other editors before making or restoring a backup. This command is a local filesystem tool, not a browser endpoint or a synchronization service. It accepts a project **data directory** (repository project: its .prism directory; standalone project: its project root). Use a new destination outside that source. Keep backups outside repositories and protect them as private project data.

```sh
npm run backup -- create /path/to/project/.prism /path/to/new-backup
npm run backup -- verify /path/to/new-backup
npm run backup -- restore /path/to/new-backup /path/to/new-data-root
```

The parent of each new destination must exist. No existing destination is overwritten. Restore produces a new standalone data root; it does not register the project, restore Git history, or mutate the original project. Register that root separately. A restore that fails after creation retains an incomplete marker and cannot be opened by Prism; retry using a different new destination.

Included: record Markdown, saved views, templates, schema, trash and local acceptance evidence. Excluded: source code, Git history, caches, machine-local registry, browser recovery drafts, assets and unrelated files. Unrecognized entries inside the scoped stores, symlinks, oversized files and invalid manifests are rejected rather than silently skipped. Limits: 20,000 files, 16 MB per file, 256 MB total. The versioned manifest records each relative path, byte length and SHA-256 digest; it is written last. Verification checks the complete scoped inventory and file hashes. These are integrity checks, not signatures or authenticity guarantees. Backup compares source contents again before publishing its manifest, but does not provide a transactional snapshot or protection against simultaneous malicious filesystem changes. Do not treat a copy without a valid manifest as a backup.

Keep a separate protected copy on another device and periodically verify and restore into disposable directories.
