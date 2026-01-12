# Hexagonal Work Specification Template (Canonical)

Use this template before implementing changes. The goal is to stabilize contracts first and keep responsibilities in the correct layers.

## 1. Requirement Overview
- Feature / Fix Title:
- Problem Statement & Value:
- Constraints & Acceptance Metrics:
- Dependencies / External Inputs:

## 2. Layer & Component Impact Matrix
For every line, describe planned work or write “No updates”.

- Domain Layer (business rules / entities / policies):
- Application Layer (use cases / orchestrators / validation):
- Ports (inbound/outbound contracts):
- Adapters (UI / storage / network / platform integrations):
- Presentation (views/widgets/templates/styles):
- Configuration & Infrastructure (flags, wiring, bootstrap):
- Localization (new keys/updates):
- Tests (unit/integration/UI):
- Documentation & Operational Notes (README/docs/migrations):

## 3. Execution Stages
Plan the order so contracts stabilize before implementations.

1) Domain validation  
2) Application contracts  
3) Ports alignment  
4) Adapter implementations  
5) Presentation & styling  
6) Configuration & infrastructure wiring  
7) Testing & documentation
