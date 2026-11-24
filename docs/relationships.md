# Relationship format

Records remain Markdown with YAML frontmatter. Each relationships entry is either a legacy record ID (generic related-to) or an explicit object with kind and target.

```yaml
relationships:
  - architecture
  - kind: implements
    target: typed-relationships
  - kind: depends-on
    target: lockfile
```

The source is the containing record. The target is a stable ID in the same project. The relation is directional. The inverse label is derived from the same edge, never persisted as a second link. Existing strings are read and saved unchanged; assigning a type is an explicit author action. A generic edge and an explicit edge to the same target are distinct statements. Identical projected edges are deduplicated.

| Kind | Inverse label | Initial endpoint rules |
|---|---|---|
| related-to | Related from | Any record |
| implements | Implemented by | Feature, System, Task or Mechanic to Requirement or Feature |
| verifies | Verified by | Test to Requirement or Feature |
| depends-on | Required by | Any record |
| blocks | Blocked by | Any record |
| documents | Documented by | Document to any record |

The editor filters compatible targets and excludes self-links and duplicate additions. The file/API schema validates edge shape, ID and known kind. Existing externally authored missing targets, self-links and incompatible endpoint types remain readable and appear in Audit rather than being silently erased. Changing a record type can expose existing invalid links; resolve these explicitly. No global dependency cycle detection or custom relation schema yet. A verifies link is not verification evidence by itself.

No bulk migration is required. Older Prism builds cannot read typed object entries; use the current branch after adding typed edges.
