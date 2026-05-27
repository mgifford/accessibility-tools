# DESIGN.md — accessibility-tools

> A machine-readable style standard for human and AI collaboration.
> Follows the [STYLES.md](https://github.com/mgifford/STYLES.MD) format.

---

## Scope

| Surface | Files | Applies? |
| :--- | :--- | :--- |
| **Published dashboard (gh-pages)** | `gh-pages/*.html`, `gh-pages/style.css` | ✅ |
| **Repository documentation** | `README.md`, `CONTRIBUTING.md`, and other Markdown files | ✅ |

---

## 1. Core philosophy

1. **Accessibility first:** Every design decision must meet or exceed WCAG 2.2 AA. The site that audits accessibility must itself be accessible.
2. **Colour with purpose:** Colour communicates meaning (success, warning, archived vs active) rather than decoration alone. Each colour is paired with text or iconographic reinforcement so it is never the sole indicator.
3. **Progressive enhancement:** All data tables and content are readable without CSS or JavaScript. Styles and scripts layer on top.
4. **Plain language:** Labels, headings, and link text describe the destination or action, never just "click here" or "read more".

---

## 2. Voice and tone

### Target reading level

- Aim for a **grade 8** reading level for dashboard UI copy.
- Test with [Hemingway App](https://hemingwayapp.com/) or equivalent.

### Plain language rules

| Avoid | Use instead |
| :--- | :--- |
| Click here | Descriptive link text (e.g. "View archive") |
| Report bundle | Report |
| Workflow run | Scan run |
| Navigate to | Open / Go to |

### Grammar defaults

- **Voice:** Active
- **Headings:** Sentence case
- **Oxford comma:** Yes
- **Spelling:** Canadian English (en-CA)

---

## 3. Design tokens

All tokens live in `gh-pages/style.css` as CSS custom properties under `:root`.
Dark-mode overrides are declared inside `@media (prefers-color-scheme: dark)`.

### Colour palette

| Token | Light value | Dark value | Contrast on bg | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `--color-primary` | `#1565c0` | `#90caf9` | 5.9:1 / 8.5:1 | Deep blue — links, headings, buttons |
| `--color-primary-dark` | `#0d47a1` | `#bbdefb` | 7.5:1 | Hover state |
| `--color-primary-light` | `#e3f0ff` | `#1a2744` | — | Subtle tinted fills |
| `--color-secondary` | `#00695c` | `#80cbc4` | 5.6:1 / 7.4:1 | Teal — accent cards, banners |
| `--color-success` | `#1b5e20` | `#a5d6a7` | 8.5:1 | Zero-violation badge |
| `--color-error` | `#b71c1c` | `#ef9a9a` | 8.0:1 | Error messages |
| `--color-warning` | `#e65100` | `#ffcc80` | 4.6:1 | Non-zero violation badge |
| `--color-text` | `#1a237e` | `#e8eaf6` | ~12:1 | Headings |
| `--color-text-body` | `#263238` | `#cfd8dc` | ~10:1 | Body copy |
| `--color-text-muted` | `#546e7a` | `#90a4ae` | 4.6:1 | Secondary/supporting text |
| `--color-bg` | `#f4f6fb` | `#0f1117` | — | Page background |
| `--color-surface` | `#ffffff` | `#1a1d26` | — | Card background |

All contrast ratios are measured against their expected background colour.
Every value meets or exceeds **WCAG 2.2 AA** (4.5:1 for normal text, 3:1 for large
text and UI components).

### Typography

| Token | Value |
| :--- | :--- |
| `--font-stack` | `Inter, 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif` |
| `--font-size-base` | `1rem` (16 px at browser default) |
| `--line-height-base` | `1.6` |

- All font sizes use `rem` units so they scale with the user's browser setting.
- Minimum body text size: 1 rem (16px equivalent).

### Spacing scale

| Token | Value |
| :--- | :--- |
| `--space-xs` | `0.25 rem` |
| `--space-sm` | `0.5 rem` |
| `--space-md` | `1 rem` |
| `--space-lg` | `1.5 rem` |
| `--space-xl` | `2 rem` |
| `--space-2xl` | `3 rem` |

### Border radii

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--radius-sm` | `6px` | Inputs, badges, status messages |
| `--radius-md` | `10px` | Table wrappers, banners |
| `--radius-lg` | `16px` | Cards, site header |

---

## 4. Accessibility constraints

- Heading levels are sequential (`h1` → `h2` → `h3`). No skipping.
- Every page starts with a visible-on-focus **skip link** (`<a class="skip-link" href="#main-content">`).
- All interactive elements have a **visible focus indicator** (3 px solid `--color-primary` outline, 1–3 px offset).
- All `<table>` elements include `scope="col"` on header cells and a descriptive `aria-label`.
- All links describe their destination. "Download ZIP" includes "(HTML & JSON)" in the archive to clarify contents.
- Colour is never the sole means of conveying information:
  - Violation counts use both a badge colour and a numeric value.
  - Status messages use both colour and a left border.
- Minimum contrast: 4.5:1 for body text, 3:1 for large text and UI components (WCAG 2.2 AA).
- `role="status"` and `aria-live="polite"` on the scan submission feedback region.
- The archive page explicitly states that direct HTML report links are unavailable and explains the ZIP download alternative.

---

## 5. Data architecture — 31-day active window

Reports and history are split into two tiers:

| Tier | Where shown | Links available |
| :--- | :--- | :--- |
| **Active** (≤ 31 days old) | Dashboard (`index.html`), Reports (`reports.html`) | HTML report + ZIP download |
| **Archived** (> 31 days old) | Archive (`archive.html`) | ZIP download only |

The 31-day cutoff is calculated client-side in JavaScript using `Date.now() - 31 * 24 * 60 * 60 * 1000`. Both `history.json` and `report-index.json` are merged in `archive.js` so every archived run has a consistent entry regardless of which data source it originated from.

Archived HTML reports are intentionally not linked directly; users must download and unzip to access them. This prevents outdated standalone HTML pages from appearing in search results or being navigated to directly.

---

## 6. AI agent rules

- Read this file before editing any file in `gh-pages/`.
- Never remove the skip link or `aria-live` region from any dashboard page.
- Never introduce inline `<style>` blocks in the HTML pages — use `style.css` tokens.
- When adding a new colour, add it as a CSS custom property in `style.css` with both a light and dark value, and document it in the table in section 3 of this file.
- Do not hard-code pixel font sizes; use `rem` and the spacing/sizing tokens.
- All table `<th>` cells must keep `scope="col"` or `scope="row"`.

---

## 7. References

- [STYLES.md format](https://github.com/mgifford/STYLES.MD)
- [ACCESSIBILITY.md](https://github.com/mgifford/ACCESSIBILITY.md)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Plain Language Guidelines](https://www.plainlanguage.gov/guidelines/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
