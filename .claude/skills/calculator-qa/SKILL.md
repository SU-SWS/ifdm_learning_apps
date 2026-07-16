---
name: calculator-qa
description: >-
  A manual QA checklist for verifying a calculator in this repo before calling a
  change done. There is no automated test suite, so verification is by hand.
  Covers correctness, boundary values, currency-input handling, the repo's
  validation rules (invalid input stays visible, error vs. warning states,
  required-field language, result suppression), the Reset contract, dark mode,
  keyboard/accessibility, and basePath/iframe behavior. Use after editing or
  adding a calculator, before merging or deploying. Do NOT use as a substitute
  for deriving the math (that is rigorous-accountant) or for root-causing a
  specific bug (that is run-observe-propose-verify).
---

# Calculator QA checklist

This repo has **no test suite**. Verification is manual: run `yarn dev` and
exercise the calculator in the browser. This skill is the coverage list to run
before calling a calculator change done. It complements, not replaces, the
other skills: `rigorous-accountant` proves the math is correct; `calculator-qa`
confirms the *whole calculator* behaves across inputs, states, and environments.

Run against the specific `app/interactives/<name>/page.tsx` you changed. Each
calculator owns its own math and validation, so results here do **not** transfer
to sibling calculators or `-v2` variants. QA each file you touched.

The behaviors below are the repo-wide rules. Section references like "(§1)"
point to `docs/calculator-global-rules.md`, which has the exact tokens, hex
values, and code patterns for each one. Check the behavior here; read the doc
for the specifics.

## Preconditions

- [ ] `yarn lint` passes (eslint, runs against `app/` only).
- [ ] `yarn build:local` compiles. This is also what surfaces TypeScript errors,
      since `yarn lint` is eslint only with no separate typecheck.
- [ ] `yarn dev` and open `/interactives/<name>/`.

## 1. Correctness (happy path)

- [ ] A known input set produces the expected output; confirm against an
      independent calculation (invoke `rigorous-accountant` if unsure).
- [ ] Every "solve for" / mode / tab produces sensible results.
- [ ] Each compounding/payment frequency gives the right period count
      (daily 365, weekly 52, bi-weekly 26, monthly 12, quarterly 4,
      semi-annual 2, annual 1). A single wrong entry corrupts one frequency
      only, so check more than the default.

## 2. Boundary & edge values

- [ ] **Zero interest rate** — the code special-cases it with `=== 0`, not
      `<= 0`; no divide-by-zero or `log(1)`; result is the linear case
      (e.g. principal / payment). (§10)
- [ ] **Very high rate** and **very large principal** — no overflow garbage;
      output above `1e15` renders as "Too large to display", never scientific
      notation, if the file has that concept. (§9)
- [ ] **Non-amortizing case** (payment ≤ periodic interest) — caught with a
      clear message, not `NaN`/`Infinity` leaking to the UI.
- [ ] **Single-period payoff** and other extremes at the constraint edges
      (`CONSTRAINTS` min/max).
- [ ] **Empty / partial / non-numeric input** (`""`, `-`, `.`, letters) — no
      crash; sensible empty or error state.

## 3. Currency & number input

- [ ] Comma grouping displays correctly and is stripped before computing.
- [ ] Decimal entry, leading `.`, and negative values (where allowed) behave on
      change and on blur; a bare leading `.` gets a `0` prepended on blur. (§2)
- [ ] Leading zeros are stripped on numeric fields (`007` becomes `7`) while
      `0.8` and `.8` still work. (§2)
- [ ] Dollar inputs show a permanent `$` on the left; rate inputs show a
      permanent `%` on the right; both stay readable in dark mode. (§3)
- [ ] Output uses `Intl.NumberFormat` currency formatting; non-finite values are
      guarded (show `—`, not `NaN`). (§9)

## 4. Validation: error & warning states

- [ ] **Invalid input stays visible.** Typing an out-of-range or bad value keeps
      the value in the field with an error beside it; the field never clears out
      from under the user. This is the most important validation rule in the
      repo. A field that blanks on invalid input is a bug. (§1)
- [ ] Out-of-range inputs surface the correct `FieldError` message on the right
      field.
- [ ] Required-field error messages start with "Please enter" (e.g. "Please
      enter an interest rate."), not a bare "Enter". (§6)
- [ ] Calc-level errors (e.g. no meaningful rate) show the intended message.
- [ ] Clearing a bad input clears its error.
- [ ] **Empty required field suppresses the result.** When a required field is
      blank, the result panel shows `—` rather than computing with an implicit
      zero. Optional fields are excluded from that guard. (§7)
- [ ] **Warnings work as advisory states.** Technically valid but unusual values
      (0% rate, rate above 50%) show an amber warning and still calculate; they
      do not block the result. (§5)
- [ ] **Error wins over warning.** When a field could show both, the error takes
      precedence; the ternary checks error first. (§5)
- [ ] **Warning border matches warning text.** Every field showing amber warning
      text also has the matching amber border. Amber text with no amber outline
      (or the reverse) is a bug. (§5)

## 5. Reset

- [ ] The calculator has a Reset button (`Button` with `variant="lagunita"`,
      `size="sm"`). (§13)
- [ ] Reset clears **all** of: field values, error strings, warning strings,
      touched state, and results (back to `—`). Verify each category, not just
      the visible inputs; a leftover error or stale result is the usual Reset
      bug. (§13)

## 6. Dark mode & styling

- [ ] Toggle dark/light — every color has a proper counterpart; no invisible or
      low-contrast text.
- [ ] Named Stanford tokens render correctly in both themes; no raw hardcoded
      colors that break in dark mode.
- [ ] Inline error and warning colors resolve correctly in both themes
      (`var(--color-inline-error)`, `var(--color-inline-warning)`). (§4, §5)

## 7. Accessibility

- [ ] Every input has an associated `<Label htmlFor>`; there is an `sr-only`
      `<h1>`.
- [ ] Results region is `aria-live="polite"` and announces on change.
- [ ] Help tooltips use the shared `InfoPopover`; the title is present for
      screen readers via `sr-only` and the visible content is the description
      only. (§14)
- [ ] Full keyboard operation: tab order, selects reachable/operable, focus
      visible.

## 8. Embed / environment

- [ ] No hardcoded absolute asset paths (basePath is environment-driven —
      empty in prod, `/ifdm_learning_apps_staging` in staging).
- [ ] Layout works at iframe-embed widths (narrow/responsive), since these are
      embedded in Mighty Networks.

## Report

State exactly what you exercised: which inputs, frequencies, and states, and the
pass/fail of each area. Call out anything you did **not** test (e.g. "did not
verify on a mobile viewport"). A green compile is not a pass; behavior in the
browser is.