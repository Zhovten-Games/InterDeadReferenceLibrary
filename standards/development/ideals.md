# Ideals

These ideals are the default engineering constraints for InterDead repositories. Their purpose is to keep systems maintainable, predictable, and safe to change.

## 1) Separation of concerns

- Keep business rules independent from UI, infrastructure, frameworks, and storage specifics.
- External interactions must be isolated behind contracts (ports/interfaces) and implemented by adapters.

## 2) Stable contracts over incidental implementations

- Treat port contracts as the core API surface: changes require explicit review and documentation updates.
- Adapters may change freely as long as they preserve contract behavior.

## 3) Configuration-driven behavior

- Feature flags and environment-dependent behavior must be defined in configuration, not embedded as branching logic across services.
- Code should read configuration, not “invent” it.

## 4) Reactive, decoupled UI

- UI state changes must be driven via events/state streams, not direct cross-component calls.
- Application services must not manipulate the DOM (or platform UI primitives) directly.

## 5) Consistent naming and predictable placement

- Files and symbols should be discoverable by convention: similar concepts belong in the same categories across repositories.
- Avoid “unique snowflake” layouts; prefer consistent folder taxonomy and naming rules.

## 6) Centralized error reporting and observability

- Errors must be captured consistently through a single logging/error boundary.
- Avoid scattered ad-hoc logging and unstructured exception swallowing.

## 7) Localization-first

- All user-facing strings must be sourced from localization resources.
- Dynamic UI output must be re-localized after DOM/markup insertion (or equivalent rendering operations).

## 8) Resource lifecycle discipline

- Acquire/release external resources explicitly (streams, database handles, subscriptions, timers).
- Every subscription must have a defined disposal path.

## 9) Fix one thing, don’t break another

- Every change must be validated against existing key behaviors.
- Prefer small, reversible steps; avoid multi-purpose changes without explicit separation.
