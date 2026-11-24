# Emberfall — Prism reference project

A fictional, compact top-down exploration game about recovering three ember fragments in an abandoned sanctuary. This is a reference project for evaluating Prism, not a production game.

## Play the prototype

Install Rust and Bevy's platform dependencies (see https://bevyengine.org/learn/quick-start/getting-started/setup/). From this directory:

```sh
cargo run
cargo test
```

Use WASD or the arrow keys to move. Collect all three amber fragments and return to the teal sanctuary. The window title displays progress. Press R to reset. Bevy 0.16.1 is pinned for reproducibility; this is an intentionally small baseline, not a recommendation for new production Bevy projects. Cargo.lock should be generated and committed after the first successful dependency resolution. The prototype has not been compiled or playtested by the author of this fixture.

## Explore with Prism

The authoritative game implementation is in `src/`. Human-authored documentation is in `docs/`; project knowledge is in `.prism/records/`. Assets are referenced by relative paths. There is no dependency on Prism in the Rust game.

Open this project through the included registry at `examples/bevy.projects.yaml` from the Prism root. See the [integration guide](../README.md).

Use the Board for workflow, Table for records, Gallery for metadata-based visual cards, Slides for live record-based presentations, Repository for original file previews, and Audit for missing descriptions/broken links. The current Gallery cannot render the supplied asset files and the Repository view is not a generated wiki.

All records and plans are fictional. Implementation references are inspectable; status Ready denotes an example planning state, not independent test evidence.
