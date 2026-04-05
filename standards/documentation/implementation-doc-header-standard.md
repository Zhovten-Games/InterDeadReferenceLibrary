# Implementation Documentation Header Standard (Canonical, Public)

This standard defines how to write front-matter headers for documents that describe implementation artifacts (services, ports, adapters, engine nodes, bootstrap modules).

## 1) Purpose

The header must work as a reusable metadata contract for:

- dependency tracing,
- architecture navigation,
- neuro-map indexing,
- runtime narrative alignment,
- metadata alignment with runtime logging.

This document is public-safe: it **does not** expose internal log formalization.

## 2) Scope

Apply this standard to implementation docs such as:

- `InterDeadProto/docs/proto-dev/src/**.md`
- equivalent runtime/implementation docs in other repositories.

Do not use this schema for world lore or narrative canon documents.

## 3) Header metadata groups

Treat the header as a three-group metadata contract:

1. **Core metadata**
2. **Neuro-map metadata**
3. **Public log bridge metadata**

## 4) Header schema

### Required keys

```yaml
schemaVersion: 1
source: src/path/to/file.js
source_exists: true
runtime_role: snake_case_runtime_role
contour_primary: THAL-GATE
contour_secondary: none
role_group: sensory_ingress
narrative_role: "runtime perception gateway"
```

### Recommended keys

```yaml
domains: []
emits: []
implements: []
imports: []
listens: []
owns: []
used_by: []
```

These recommended graph keys are actively used in existing implementation docs and should be kept when available for dependency tracing and navigation.

### Full example

```yaml
---
domains: []
emits: []
implements: []
imports: []
listens: []
owns: []
schemaVersion: 1
source: src/path/to/file.js
used_by: []
source_exists: true
runtime_role: snake_case_runtime_role
contour_primary: THAL-GATE
contour_secondary: none
role_group: sensory_ingress
narrative_role: "runtime perception gateway"
---
```

## 5) Key rules

- `schemaVersion`: integer, currently `1`.
- `source`: path to implementation source file.
- `source_exists`: boolean; must reflect the current repository state for the path in `source`.
- `runtime_role`: stable snake_case identifier.
- `narrative_role`: short stable phrase describing the narrative function.
  - Examples:
    - `runtime perception gateway`
    - `salience routing node`
    - `executive coordination entrypoint`
- `domains`, `emits`, `implements`, `imports`, `listens`, `owns`, `used_by`: arrays of relative source paths.

## 6) Neuro-map metadata rules

### Closed `role_group` enum

Use only values from the operational stack:

- `sensory_ingress`
- `salience_threat`
- `executive_control`
- `memory_narrative`
- `body_regulation`
- `anomaly_layer`

### Neuro consistency rules

- `contour_primary` and `contour_secondary` must use canonical contour codes from the neuro-voice interpretation stack.
- If there is no second contour, use:

```yaml
contour_secondary: none
```

- Do not invent custom role groups.

## 7) Public log bridge metadata rules

Implementation docs support metadata alignment with runtime logging, but this standard must remain public-safe.

### Allowed in public docs

- Keep `runtime_role`, contour fields, and `narrative_role` aligned with runtime behavior.
- Optionally include high-level notes in body text about what the component logs (without log grammar/spec internals).

### Forbidden in public docs

- Do not publish closed log grammar, token semantics, hidden severity matrix, private correlation mechanics, or private orchestration formulas.

### Private reference (standard-level only)

Authoritative private formalization is maintained in InterDead:

- `InterDead/99_ADMIN/policies/implementation-log-header-private-policy/`

Individual implementation documents do not need to reference the private policy.

## 8) Authoring workflow

1. Fill required keys.
2. Add recommended graph keys when available.
3. Assign neuro-map keys using canonical contour and role group values.
4. Validate `source` and `source_exists`.
5. Add public-safe logging notes if required.
6. If deeper log rules are needed, consult the private policy directory (language-specific file) without reproducing it.

## 9) Validation checklist

- Header exists and is valid YAML.
- All required keys are present.
- `source_exists` value reflects the current repository state.
- `role_group` belongs to the closed enum.
- If there is no second contour, `contour_secondary` is exactly `none`.
- Private log formalization is not duplicated in the public document.
- Private reference path in this standard is correct and current.
