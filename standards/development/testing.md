# Testing

## Expectations

- Every module that contains logic must land with targeted tests.
- Tests must state the scenario they cover (short description in test names or comments).

## Coverage focus

- Services: behavior and policy decisions.
- Ports: contract expectations and edge cases.
- Adapters: integration behavior and error handling (mock external systems).
- UI/presentation: minimal DOM rendering tests where applicable.

## Discipline

- Prefer small, deterministic tests.
- Avoid coupling tests to incidental implementation details; assert outcomes and contract behavior.
