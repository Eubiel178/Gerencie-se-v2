---
name: designing-ui-systems
description: Use when a project needs reusable UI tokens, component conventions, variants, responsive rules, or a coherent design system across multiple screens or features.
---

# Designing UI Systems

## Goal
Turn repeated visual decisions into explicit tokens and component contracts without over-abstracting one-off design.

## Workflow
1. Audit repeated values and patterns already present in the codebase.
2. Separate foundations from components: color, typography, spacing, radius, elevation, motion, breakpoints, then component APIs.
3. Prefer semantic tokens such as `surface`, `muted`, `accent`, `danger`, `focus` over component-specific colors.
4. Use Tailwind theme variables or CSS custom properties as the source of truth; avoid scattered magic values.
5. For shadcn/ui, preserve composability. Extend variants rather than forking large components unless necessary.
6. Define state behavior and responsive rules alongside visual variants.
7. Document exceptions instead of distorting the global system to fit a single page.

## Component contract
A reusable component should have:
- clear responsibility;
- predictable variants;
- accessible keyboard and focus behavior;
- loading/disabled/error states when relevant;
- no hidden layout assumptions about its parent;
- minimal client-side state.

## Avoid
- premature tokenization of every value;
- deep variant matrices no screen actually uses;
- one giant design-system component replacing semantic HTML;
- arbitrary Tailwind values repeated across many files;
- visual consistency that destroys product hierarchy.
