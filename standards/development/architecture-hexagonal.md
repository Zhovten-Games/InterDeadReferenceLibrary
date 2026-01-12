# Hexagonal Architecture (Project Standard)

## Layer intent

- **Domain**: business rules and invariants.
- **Application**: orchestration/use cases that coordinate domain behavior through ports.
- **Ports**: boundary contracts between application and external world.
- **Adapters**: implementations of ports for UI, storage, network, platform APIs, third-party services.
- **Infrastructure**: composition root (DI container, bootstrap sequence, wiring).

## Dependency direction

- Domain and application must not depend on adapters or infrastructure.
- Adapters depend on ports/contracts, not the other way around.

## Operational rule

- If a change requires reaching “across layers”, introduce a port or refactor responsibilities instead of violating dependency direction.
