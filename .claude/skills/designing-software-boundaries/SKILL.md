---
name: designing-software-boundaries
description: Use when modules, services, packages, or teams have unclear ownership, cyclic dependencies, shared state, change coupling, or responsibilities that are difficult to evolve independently.
---

# Designing Software Boundaries

## Core principle
A useful boundary groups cohesive responsibility and limits what the rest of the system must know. Draw boundaries from behavior, ownership, state, and change coupling before drawing them from folders or deployment topology.

## Boundary workflow
1. Map the current system through entry points, important workflows, owned data, external integrations, and dependency directions.
2. Look for things that change together. Features, rules, state, and tests that repeatedly move in the same changeset are evidence of cohesion.
3. Look for costly coupling. Flag cycles, shared mutable state, cross-module table writes, internal type leakage, broad utility modules, and callers that know implementation details.
4. Propose a responsibility statement for each boundary: what it owns, what it exposes, and what it explicitly does not own.
5. Define a narrow public contract. Other modules should depend on stable capabilities, not internal storage, framework objects, or private classes.
6. Make dependency direction intentional. A boundary may call outward through a contract it owns; avoid bidirectional knowledge and hidden callback chains.
7. Assign state and write ownership. If two boundaries must coordinate one mutation, make the consistency requirement explicit rather than silently sharing persistence internals.
8. Test from the outside. Boundary tests should prove observable contracts while allowing internal structure to change.

## Boundary quality checks
A proposed boundary is weak when:
- its responsibilities cannot be summarized without “and” repeatedly;
- most changes require editing both sides;
- consumers import internal files or database structures;
- ownership is ambiguous;
- runtime communication is much more frequent than the supposed independence warrants;
- the boundary exists only because the repository has a folder or technical layer with that name.

Prefer high cohesion inside a boundary and low knowledge across boundaries. Do not create a network boundary merely to enforce modularity that can be enforced inside one deployable.

## Relation to API boundaries
This method defines structural ownership and dependency boundaries. When a Node.js endpoint also crosses an external trust or authorization boundary, use `building-reliable-node-api-boundaries` for transport, validation, authorization, retry, and failure semantics.

## Verification
For each boundary, trace one normal flow and one change scenario. Confirm that the public contract is sufficient, internal details remain private, ownership is clear, and the change does not require unrelated consumers to understand the implementation.

## References
- Microsoft, separation of concerns and dependency inversion: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles
- AWS, cohesion and coupling analysis: https://docs.aws.amazon.com/prescriptive-guidance/latest/database-decomposition/cohesion-coupling.html
