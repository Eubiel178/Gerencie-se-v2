---
name: choosing-application-architecture
description: Use when starting or reshaping an application where deployment topology, scaling, reliability, ownership, coupling, or delivery constraints make the architectural shape unclear.
---

# Choosing Application Architecture

## Core principle
Choose architecture from the forces the system must withstand, not from a fashionable pattern. Prefer the least distributed shape that satisfies the required quality attributes and change boundaries.

## Decision sequence
1. Write the decision context before naming patterns: users, critical flows, regulatory constraints, team shape, deployment environment, expected change rate, and current operational capability.
2. Turn vague non-functional goals into scenarios. For each important quality attribute, state the stimulus, operating condition, expected response, and measurable threshold.
3. Map change and ownership boundaries. Identify which capabilities change together, which need independent release cadence, and which require distinct data or failure isolation.
4. Establish the simplest viable baseline. A single deployable with strong internal modules is valid when independent deployment, scaling, or failure containment are not demonstrated requirements.
5. Compare only realistic alternatives. Evaluate coupling, data consistency, latency, operability, testing cost, deployment independence, failure modes, and migration cost.
6. Make the trade-off explicit. Every option should state what it improves, what complexity it introduces, and which assumptions would invalidate it.
7. Record architecturally significant choices with an ADR and a review trigger instead of treating the decision as permanent truth.

## Evidence before distribution
Do not split a system merely because it is large. Require evidence such as:
- materially different scaling profiles;
- independent deployment or ownership needs;
- fault-containment requirements;
- stable business boundaries with tolerable cross-boundary communication;
- operational maturity to observe and recover distributed failures.

If those forces are absent, strengthen internal modularity before adding network boundaries.

## Verification
Before accepting the architecture, walk at least one scenario for:
- normal feature change;
- partial failure;
- peak load;
- schema or contract evolution;
- deployment and rollback;
- observability and incident diagnosis.

Reject an option if its claimed benefit cannot be tied to a concrete scenario or constraint.

## References
- SEI, quality attributes and architecture evaluation: https://www.sei.cmu.edu/library/principles-for-evaluating-the-quality-attributes-of-a-software-architecture/
- Microsoft, architectural principles: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles
- AWS, architectural decision records: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html
