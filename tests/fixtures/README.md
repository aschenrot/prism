# Regression fixtures

The Emberfall fixture is a frozen snapshot of the example at commit d0344c0. It is intentionally independent of the editable project at examples/emberfall.

Do not open this fixture as a workspace. Tests assert the original 19 records and four view definitions against this snapshot. Test cases that write files use temporary directories. Update fixtures deliberately with corresponding test expectations; do not synchronize them from the live example on every run.

The Rust files here are inert source samples for repository browsing, not a separate build target.
