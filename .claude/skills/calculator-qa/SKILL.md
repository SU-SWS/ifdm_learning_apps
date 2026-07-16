---
name: calculator-qa
description: >-
  A manual QA checklist for verifying a calculator in this repo before calling a
  change done — there is no automated test suite, so verification is by hand.
  Covers boundary values, currency-input handling, error/validation states,
  dark mode, keyboard/accessibility, and basePath/iframe behavior. Use after
  editing or adding a calculator, before merging or deploying. Do NOT use as a
  substitute for deriving the math (that's rigorous-accountant) or for
  root-causing a specific bug (that's run-observe-propose-verify).
---

# Calculator QA checklist

This repo has **no test suite** — verification is manual (`yarn dev`, exercise
the calculator in the browser). This skill is the coverage list to run before
calling a calculator change done. It complements, not replaces, the other
skills: `rigorous-accountant` proves the math is correct; `calculator-qa`
confirms the *whole calculator* behaves across inputs, states, and environments.

Run against the specific `app/interactives/<name>/page.tsx` you changed. Each
calculator owns its own math and validation, so results here do **not** transfer
to sibling calculators or `-v2` variants — QA each file you touched.

## Preconditions

- `yarn lint` passes.
- `yarn build:local` compiles.
- `yarn dev` and open `/interactives/<name>/`.

## 1. Correctness (happy path)

- [ ] A known input set produces the expected output; confirm against an
      independent calculation (invoke `rigorous-accountant` if unsure).
- [ ] Every "solve for" / mode / tab produces sensible results.
- [ ] Each compounding/payment frequency gives the right period count
      (daily 365, weekly 52, bi-weekly 26, monthly 12, quarterly 4,
      semi-annual 2, annual 1) — a single wrong entry corrupts one frequency
      only, so check more than the default.

## 2. Boundary & edge values

- [ ] **Zero interest rate** — no divide-by-zero / `log(1)`; result is the
      linear case (e.g. principal / payment).
- [ ] **Very high rate** and **very large principal** — no overflow garbage;
      "too large to display" handled if the file has that concept.
- [ ] **Non-amortizing case** (payment ≤ periodic interest) — caught with a
      clear message, not `NaN`/`Infinity` leaking to the UI.
- [ ] **Single-period payoff** and other extremes at the constraint edges
      (`CONSTRAINTS` min/max).
- [ ] **Empty / partial / non-numeric input** (`""`, `-`, `.`, letters) — no
      crash; sensible empty or error state.

## 3. Currency & number input

- [ ] Comma grouping displays correctly and is stripped before computing.
- [ ] Decimal entry, leading `.`, and negative values (where allowed) behave on
      change and on blur.
- [ ] Output uses `Intl.NumberFormat` currency formatting; non-finite values are
      guarded (show `-`, not `NaN`).

## 4. Validation & error states

- [ ] Out-of-range inputs surface the correct `FieldError` message on the right
      field.
- [ ] Calc-level errors (e.g. no meaningful rate) show the intended message.
- [ ] Clearing a bad input clears its error.
- [ ] Exact token values and rules for each check are in `docs/calculator-global-rules.md`
(warning hexes `#9A6207` / `#C37C09`, `var(--color-inline-error)`, etc.).

## 5. Dark mode & styling

- [ ] Toggle dark/light — every color has a proper counterpart; no invisible or
      low-contrast text.
- [ ] Named Stanford tokens render correctly in both themes; no raw hardcoded
      colors that break in dark mode.

## 6. Accessibility

- [ ] Every input has an associated `<Label htmlFor>`; there's an `sr-only`
      `<h1>`.
- [ ] Results region is `aria-live="polite"` and announces on change.
- [ ] Full keyboard operation: tab order, selects reachable/operable, focus
      visible.

## 7. Embed / environment

- [ ] No hardcoded absolute asset paths (basePath is environment-driven —
      empty in prod, `/ifdm_learning_apps_staging` in staging).
- [ ] Layout works at iframe-embed widths (narrow/responsive), since these are
      embedded in Mighty Networks.

## Report

State exactly what you exercised — which inputs, frequencies, and states — and
the pass/fail of each area. Call out anything you did **not** test (e.g. "didn't
verify on a mobile viewport"). A green compile is not a pass; behavior in the
browser is.
