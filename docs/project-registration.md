# Local project registration

The local shell is the authorization boundary for existing external folders. New standalone workspaces can be created from Prism within its fixed managed storage directory. Stop Prism before registration or settings changes; run commands from the Prism checkout. No environment variables or manual YAML editing are required.

```sh
npm run project -- list
npm run project -- add my-game "My game" "/path/to/existing/game" repository core,game,rust,project
npm run project -- settings my-game "My game — production" core,game,rust,project owner/repository
npm run dev
```

Use standalone for an existing directory that stores records directly. Repository mode stores data in its .prism directory. Both use the existing local API. Folder roots are canonicalized for duplicate detection; overlapping project data stores, incomplete restores and linked store directories are rejected. Registration does not initialize or execute the target project; normal startup initializes its Prism stores. The first registration preserves existing portable/default entries and publishes .prism/projects.local.yaml, which is ignored by Git. If using the unconfigured standalone fallback, open the default workspace once before registering a second folder. Explicit PRISM_PROJECTS or PRISM_PROJECT overrides remain authoritative; changing the default registry is refused while either is active.

The settings command replaces title, profile list and optional GitHub repository association for the stable project ID. Omit the final association or use "-" to clear it. Root and storage mode are immutable through this command: silently remapping an ID could attach browser recovery drafts to unrelated data. Removal and relocation require a separately designed identity migration. A local cooperative lock and observed registry revision protect ordinary concurrent command use; they are not a filesystem transaction against external processes. If interrupted, inspect the registry and remove a stale projects.local.yaml.lock only after confirming no command is running. Local registry files contain paths; keep them private and do not commit them. The browser project switcher receives only safe metadata, not folder paths or an arbitrary filesystem registration endpoint.

Startup applies the same disjoint-data-root and store-directory validation to every registry source, including manual YAML files and explicit environment overrides, before initializing stores. Existing nested repository roots are allowed only when their data directories are disjoint. Invalid registries fail explicitly; no alternate project is silently opened.


### Create a workspace in Prism
Choose **Create workspace** from the project selector, enter a name and choose a profile. Prism creates a new standalone directory under `.prism-workspaces.local/` in the launch directory, initializes its stores, publishes the local registry and opens the project without restarting. The browser sends a title, profile and UUID request token only; it cannot choose a path or overwrite a folder. The project ID is stable. Retrying a successful request with the same token and inputs returns the same registered workspace. A failed initialization may leave an unregistered directory; Prism never recursively deletes an uncertain directory. Inspect it locally before registering or removing it. The managed folder and local registry are ignored by Git; back up authored data separately. Explicit environment overrides disable creation; if the registry changed outside the running app, restart before retrying. Existing project paths remain unchanged.

**Connect existing project** and **Manage projects** still provide local CLI guidance. Stop Prism for those commands. When changing settings, supply the full profile list and keep the existing GitHub association argument if desired; omitting it or using a dash clears the association. Existing folder selection and graphical settings are separate follow-up work.
