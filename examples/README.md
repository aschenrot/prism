# Reference projects

## Emberfall

A small fictional Bevy game, with real Rust source and 19 connected Prism records across product, design, engineering and project management. The example is bundled with Prism so it can be evaluated immediately and copied into a separate Git repository without changing Prism.

From the Prism root:

```sh
npm install
PRISM_PROJECTS=examples/bevy.projects.yaml npm run dev
```

PowerShell:

```powershell
$env:PRISM_PROJECTS="examples/bevy.projects.yaml"
npm run dev
```

Select Emberfall and explore Board, Table, Gallery, Slides, Repository and Audit. The example includes a second standalone project to test switching and isolation.

### Saved views and knowledge evaluation

Emberfall includes Release review, Product brief, Design wiki and Requirements map. Open each preset, change filters, save a new named view and restart Prism to check persistence. Update or delete a disposable view and confirm records are unchanged. In Requirements map, follow a link and a backlink; edit a relationship in the inspector and confirm both directions refresh. In Repository, toggle a Markdown file between rendered and source preview.

### Suggested evaluation
1. Open the Feature record "Recover the lost embers" in Board; change its status and save.
2. Switch to Table and Slides and confirm the same record has the new status.
3. Open Repository and inspect src/lib.rs, src/main.rs, docs/game-design.md and tests/exploration.rs.
4. Inspect the linked IDs of a Requirement. Add a nonexistent ID, save, and confirm Audit reports it; remove it afterward.
5. Switch to Starter workspace and confirm Emberfall records are absent.
6. Restart Prism and verify persistence. Restore sample changes with Git only if you intentionally want to discard them.

### Separate game repository

Copy the entire emberfall directory into a new folder, including its hidden .prism directory. Initialize Git there, generate Cargo.lock when building, and commit authored files. Change the registry's root to the new absolute path. The game does not depend on Prism. This does not create a remote repository automatically.

The example source is provided as a prototype; the Rust build and runtime have not been verified yet.

The automated regression suite now uses a separate frozen fixture under tests/fixtures/emberfall. You may freely add or change example records and saved views without changing test expectations.
