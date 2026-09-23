---
name: building-premium-nextjs-interfaces
description: Use when creating or redesigning a polished Next.js or React interface where visual distinction, strong hierarchy, responsive behavior, accessibility, and production readiness matter.
---

# Building Premium Next.js Interfaces

## Core principle
Build a coherent visual system, not a collection of attractive components. Preserve product clarity first; premium treatment comes from disciplined typography, spacing, media, interaction, and restraint.

## Defaults
- Existing repo conventions win.
- For a new application, load `bootstrapping-modern-web-apps` first; this skill owns art direction and interface quality rather than project scaffolding.
- Prefer semantic HTML and Server Components by default; add client boundaries only where interaction requires them.
- Use real content and honest product evidence. Never invent testimonials, clients, partnerships, or metrics.

## Workflow
1. Inspect the current page, design references, app architecture, fonts, tokens, breakpoints, and reusable primitives.
2. Write a compact visual thesis: hierarchy, grid, type scale, spacing rhythm, media treatment, interaction tone, and what must remain unchanged.
3. Establish layout before decoration. Fix information architecture, section pacing, alignment, density, and responsive collapse order.
4. Reuse or extend project primitives before creating new components.
5. Add states deliberately: hover, focus, active, loading, disabled, empty, error, selected, touch.
6. Add motion only after the static composition works.
7. Verify in-browser at representative desktop and mobile sizes, then run lint/typecheck/tests/build available in the repo.

## Quality bar
- Strong first viewport without sacrificing readability.
- Typography has intentional scale, line-height, measure, and weight contrast.
- Images use deliberate aspect ratios and crop rules.
- Components align to a repeatable spacing system.
- No generic bento-grid filler, random gradient blobs, excessive glass, fake social proof, or decorative UI with no product role.
- Accessibility is part of polish: visible focus, keyboard access, labels, contrast, reduced motion.

## When not to use
Do not use this skill for narrow bug fixes, backend-only changes, or exact visual reproduction tasks where `implementing-reference-faithful-ui` is the better primary skill.
