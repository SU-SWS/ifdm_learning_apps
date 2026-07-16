---
name: new-calculator
description: >-
  Scaffold a new financial calculator in this repo following the established
  self-contained pattern (typed constants, a CONSTRAINTS object, FieldError[]
  validation, all inputs held as string in useState, currency formatting,
  InfoPopover help, dark-mode tokens, aria). Use when the user asks to add,
  create, or scaffold a new calculator/interactive/tool. Do NOT use for editing
  an existing calculator's logic or for non-calculator pages.
---

# Scaffold a new calculator

Every calculator in this repo is **one route = one file = one self-contained
`"use client"` component** at `app/interactives/<name>/page.tsx`. Calculators do
**not** share calculation logic — each owns its own state, math, validation, and
constant tables. The home page (`app/page.tsx`) auto-discovers any directory
with a `page.*` file, so no manual registration is needed.

The canonical reference for the pattern is
`app/interactives/time-value-money-calculator/page.tsx`. Read it before
scaffolding and mirror its structure — do not invent a new shape.

## Before writing

1. Confirm the calculator name and its route slug (kebab-case, e.g.
   `auto-loan-calculator`). Check no existing directory (or `-v2` variant)
   already covers it.
2. Confirm the inputs, the output(s), and the financial formula(s). If the math
   is nontrivial, derive and cross-check it first — invoke `rigorous-accountant`.
3. Decide the constraints (min/max per field) and the validation rules.
4. Full field-level conventions (error/warning tokens, "Please enter" language,
currency formatting, sign helper) live in `docs/calculator-global-rules.md`.

## The pattern to follow

Create `app/interactives/<slug>/page.tsx` as a single `"use client"` component.
Mirror the TVM reference for each of these:

- **Header:** `"use client"`, then imports from `@/app/ui/components/*`,
  `ThemeToggle` from `@/app/lib/theme-toggle`, and `InfoPopover` from
  `@/app/ui/components/popover`.
- **Typed constants at the top of the file:** option tables (e.g.
  `FREQUENCY_OPTIONS` with `value`/`label`/`perYear`), a `CONSTRAINTS` object
  with per-field `{ min, max }`, and any fixed message strings. Type them
  explicitly.
- **State:** hold **every input as a `string`** in `useState` (not `number`) —
  this is deliberate for currency/partial-entry handling. Keep result,
  overflow, and `fieldErrors: FieldError[]` in state.
- **Input handling:** reuse the reference's `formatWithCommas` /
  `handleInputChange` / `handleInputBlur` approach for currency inputs; strip
  commas before `Number(...)`.
- **Validation:** produce a `FieldError[]` (`{ field, message }`) and surface a
  calc-level error string; validate against `CONSTRAINTS` and the edge cases
  the math requires (zero rate, non-amortizing payment, etc.).
- **Math:** own, self-contained functions in this file. Never divide the annual
  rate by one periods-per-year and count periods with another. Special-case
  `rate = 0`. Never round mid-calculation — round for display only.
- **Formatting:** `Intl.NumberFormat("en-US", { style: "currency", currency:
  "USD", ... })`; guard non-finite values.
- **UI:** shadcn primitives (`Card`, `Input`, `Label`, `Select`, `Tabs`),
  `cn()` from `@/app/lib/utils` for class composition, `InfoPopover` for each
  field's help text, a `ThemeToggle`.
- **Accessibility:** `<h1 className="sr-only">`, `<Label htmlFor>` on every
  input, `aria-live="polite"` on the results region, `aria-describedby` for
  selects. See the debt-payoff and TVM files.

## Styling

- Tailwind v4 with the Stanford named tokens (`lagunita`, `berry`, `navy`,
  `--color-teal`, etc. in `app/ui/globals.css`). Prefer named tokens over raw
  hex/rgba.
- **Every color needs a dark-mode counterpart** (dark mode is class-based).
- Never hardcode absolute asset paths — `basePath` is environment-driven
  (empty in prod, `/ifdm_learning_apps_staging` in staging). Hardcoding breaks
  one environment.

## After scaffolding

1. `yarn lint` and `yarn build:local` to confirm it compiles.
2. `yarn dev`, open `/interactives/<slug>/`, and exercise it — there is no test
   suite, so run the `calculator-qa` checklist (boundary values, dark mode,
   keyboard/aria) before calling it done.
3. Confirm it appears on the auto-discovered home index.
