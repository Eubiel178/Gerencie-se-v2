---
name: auditing-pixel-perfect-frontend
description: Use when reviewing an implemented frontend against Figma, screenshots, a live reference, or explicit visual acceptance criteria and concrete visual regressions must be identified and prioritized.
---

# Auditing Pixel-Perfect Frontend

## Audit method
1. Capture the implementation at the same viewport dimensions as the reference.
2. Compare macro layout before details: section height, container width, column proportions, alignment, whitespace.
3. Compare typography: family, size, weight, line-height, letter-spacing, wrapping, clipping.
4. Compare media: crop, object position, aspect ratio, scale, masks, corner radius.
5. Compare components and states: borders, icon size, control density, hover/focus, arrows, labels, disabled/loading.
6. Repeat on mobile independently.

## Severity
- P0: broken interaction, unreadable/hidden content, severe responsive failure.
- P1: major composition mismatch visible immediately.
- P2: noticeable typography, crop, alignment, or state mismatch.
- P3: polish-level spacing, radius, shadow, or micro-detail.

## Output
Lead with findings, not praise. For each issue, state location, expected behavior, observed behavior, severity, and the most likely implementation owner.

## Rule
Do not accept “close enough” when the user explicitly asked for fidelity. Conversely, do not chase subpixel differences before resolving structural mismatches.
