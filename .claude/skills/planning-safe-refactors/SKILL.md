---
name: planning-safe-refactors
description: Use when a structural refactor crosses multiple modules, dependencies, data flows, or deployments and cannot be completed safely as one atomic change without a large blast radius.
---

# Planning Safe Refactors

## Core principle
Preserve behavior while changing structure in small, observable steps. Replace big-bang rewrites with a migration path that keeps the system releasable and gives every slice a rollback or containment strategy.

## Refactor plan
1. State the target change and the behaviors that must not change. Separate structural goals from feature work.
2. Map the blast radius: callers, dependencies, data ownership, runtime flows, tests, deployments, and operational dashboards affected by the change.
3. Establish characterization evidence around critical behavior before changing the structure. Add regression tests at the boundary that must remain stable.
4. Find or create a seam. Introduce the smallest interface, adapter, routing point, or compatibility layer that lets old and new structures coexist without changing consumers all at once.
5. Order migration slices so each one can ship independently. Prefer moving one caller, capability, or data path at a time.
6. Define verification and rollback for every slice. State what proves equivalence, which telemetry to inspect, and how to return traffic or callers to the old path.
7. Use controlled dual operation only when justified. Feature flags, shadow reads, comparison runs, or compatibility adapters should have an owner and a removal condition.
8. Remove legacy code only after all callers and data paths are migrated and the new path has enough evidence in production-like conditions.

## Slice quality
A safe slice should:
- have one observable structural objective;
- preserve the external contract or version it intentionally;
- keep main releasable;
- avoid mixing unrelated cleanup;
- identify its verification evidence;
- make the next slice easier rather than creating a second permanent architecture.

## Patterns
Use **Branch by Abstraction** when consumers need to migrate gradually behind a stable abstraction. Use a **Strangler Fig** approach when a larger legacy capability can be replaced incrementally behind routing or capability boundaries.

Do not add an abstraction when the entire change is already small, local, and safely atomic. Migration scaffolding is temporary complexity and must earn its cost.

## Verification
Before declaring the refactor complete, verify that:
- old and new behavior match for the protected contracts;
- no intended caller still reaches the legacy path;
- temporary flags/adapters have an explicit removal decision;
- obsolete code, configuration, metrics, and tests are removed only after migration evidence is complete.

## References
- Martin Fowler, Branch by Abstraction: https://martinfowler.com/bliki/BranchByAbstraction.html
- Martin Fowler, Strangler Fig modernization: https://martinfowler.com/articles/2024-strangler-fig-rewrite.html
