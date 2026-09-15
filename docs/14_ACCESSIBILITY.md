# 14 — Accessibility

Target: WCAG 2.2 Level AA.

Mandatory implementation rules:

- semantic landmarks/headings
- native buttons/inputs first
- keyboard reachable controls
- visible focus not obscured
- form fields with programmatic labels
- inline field error + top-level error summary for complex form
- minimum practical touch target around 44x44 CSS px; satisfy WCAG 2.2 Target Size Minimum
- color is never sole state indicator
- charts have text summaries/data fallback
- reduced motion supported
- contrast tested in light/dark modes
- dialog focus management and escape behavior
- authentication does not require cognitive puzzle beyond accessible provider flow

Automated axe-style testing is required but does not replace manual keyboard/mobile checks.
