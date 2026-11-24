---
id: "custom-schemas"
type: "Feature"
title: "Custom entity schemas and properties"
status: "In progress"
priority: "High"
accent: "amber"
tags: ["product","knowledge"]
relationships: ["knowledge-engine","data-integrity"]
---
Define project-level entity schemas using a documented versioned format, validate at read/write boundaries, generate editing controls and support typed text, number, date, enum and references. Evaluate JSON Schema/Ajv against the existing Zod application contract. Formulas and user-defined computed values need a safe declarative expression engine, not arbitrary code execution.

## First vertical slice
Version 1 schema.yaml in the project data root (repository .prism/schema.yaml, standalone schema.yaml). Optional fields for built-in types: text, finite number, calendar date, boolean, stable-ID enum, same-project record reference. No dependencies added: use the existing Zod boundary and a constrained declarative format rather than a general JSON Schema evaluator for this slice. Absent schema is an empty definition, not a migration. Malformed schemas expose errors and block custom property writes; existing primitive values, unknown metadata and unrelated editing remain intact. Property values in optional customProperties frontmatter, independent of labels and view layout. Read structural validation; semantic mismatches shown as diagnostics, never silently coerce or discard. Writes validate changed keys and exact record/schema revisions. Removed/inactive definitions preserve values; no automatic conversion, required-field migration, or destructive changes. Existing recoverable editor extends its v1 envelope with optional fields; overlapping property-map edits require an explicit choice. Record copies do not inherit custom metadata initially. Definitions authored in YAML; in-app schema administration, custom entity types, dynamic columns, search and formulas are subsequent work. See project-property-increment and property-schema-foundation. Technical checks pending; human acceptance deferred.

## Schema administration slice
Project Schemas workspace adds optional fields, changes labels, appends/relabels enum choices and retires/reactivates definitions. Server rejects field removal, kind or scope conversion, option-ID removal and stale schema writes. Existing authored record bytes do not change. Usage counts reflect loaded active records only. Custom entity type identity, schema draft reload recovery and destructive migration remain later work.
