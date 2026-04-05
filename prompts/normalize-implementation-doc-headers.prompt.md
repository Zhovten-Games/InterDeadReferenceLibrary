# Task: Normalization of Implementation Documentation Headers

## Working directory

Work inside documentation directories that describe runtime components, for example:

```text
.../src/
```

## Goal

Ensure that all documents describing script-based runtime implementations contain a correct YAML header.

Documentation must **mirror the actual implementations**, therefore it is also necessary to verify that documents correspond to existing source files.

## Standard

Use the canonical standard:

```text
InterDeadReferenceLibrary/standards/documentation/implementation-doc-header-standard.md
```

The text of the standard **must not be duplicated** in the documents. Use it as the single source of rules.

## Instructions

1. Scan implementation documents in the working directory.

2. If a document **does not contain a YAML header**, create one according to the standard.

3. If a header **already exists**, normalize it to match the canonical schema.

4. Verify that the `source` field points to the correct implementation file path.

5. Set `source_exists` according to the actual existence of the file.

6. Ensure that documentation reflects real implementation files:

   * if an implementation exists without documentation — create a document;
   * if a document describes a non-existent file — mark or remove it as obsolete.

7. Use only canonical contour values and `role_group` values defined in the standard.

8. Do not add internal logging rules or private formalization.

## Result

All implementation documents must contain a normalized YAML header and correspond to real implementation files.
