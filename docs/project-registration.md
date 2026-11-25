# Local project registration

The local shell is the authorization boundary for folders. Stop Prism before registration or settings changes; run commands from the Prism checkout. No environment variables or manual YAML editing are required.

```sh
npm run project -- list
npm run project -- add my-game "My game" "/path/to/existing/game" repository core,game,rust,project
npm run project -- settings my-game "My game — production" core,game,rust,project owner/repository
npm run dev
```

Use standalone for an existing directory that stores records directly. Repository mode stores data in its .prism directory. Both use the existing local API. Folder roots are canonicalized for duplicate detection; overlapping project data stores, incomplete restores and linked store directories are rejected. Registration does not initialize or execute the target project; normal startup initializes its Prism stores. The first registration preserves existing portable/default entries and publishes .prism/projects.local.yaml, which is ignored by Git. If using the unconfigured standalone fallback, open the default workspace once before registering a second folder. Explicit PRISM_PROJECTS or PRISM_PROJECT overrides remain authoritative; changing the default registry is refused while either is active.

The settings command replaces title, profile list and optional GitHub repository association for the stable project ID. Omit the final association or use "-" to clear it. Root and storage mode are immutable through this command: silently remapping an ID could attach browser recovery drafts to unrelated data. Removal and relocation require a separately designed identity migration. A local cooperative lock and observed registry revision protect ordinary concurrent command use; they are not a filesystem transaction against external processes. If interrupted, inspect the registry and remove a stale projects.local.yaml.lock only after confirming no command is running. Local registry files contain paths; keep them private and do not commit them. The browser project switcher receives only safe metadata, not folder paths or an arbitrary filesystem registration endpoint.

Startup applies the same disjoint-data-root and store-directory validation to every registry source, including manual YAML files and explicit environment overrides, before initializing stores. Existing nested repository roots are allowed only when their data directories are disjoint. Invalid registries fail explicitly; no alternate project is silently opened.


### Discover registration in Prism
Open the project selector and choose Create project, Connect existing project or Manage projects. The guide explains how to choose an existing folder, copy a command template, authorize the operation in the local terminal and restart. Replace the example ID, title and path before running commands; a new standalone project starts from an empty folder created in the file manager. Save or retain unsaved work before stopping Prism. The browser does not execute commands or register folders itself.

When using Manage projects, supply the entire desired profile list and include the existing owner/repository argument if you want to retain a GitHub association. Omitting it or supplying a dash clears the association.
