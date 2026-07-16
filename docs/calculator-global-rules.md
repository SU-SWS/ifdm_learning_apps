# Global Rules: Financial Calculator Suite

This document covers all policies and patterns that apply to every calculator in the suite. When working on a new calculator or adding error states to an existing one, these rules apply by default.

The four Claude Code skills in `.claude/skills/` are the task-shaped counterparts to this reference: `new-calculator` scaffolds against these patterns, `calculator-qa` verifies them, `rigorous-accountant` owns the math rules (sections 9-11), and `run-observe-propose-verify` is the debugging loop. This file is the source of the specifics they defer to.

---

## 1. Input Handling: Setters Are Unconditional

**The rule:** Always call the state setter with whatever the user typed. Error and warning logic runs independently afterward. Never gate the setter behind a validity check.

**Why it matters:** When the setter is wrapped in a conditional, invalid values disappear from the field instead of staying visible. The user loses the context of what they typed, which is confusing.

```tsx
// WRONG -- field clears on invalid input
onChange={(e) => {
  const val = e.target.value;
  if (val === "" || (Number(val) >= 0 && Number(val) <= maxValue)) {
    setMyField(val);
  } else {
    setMyFieldError("Value must be between 0 and X.");
    // setter never called -- field appears to clear
  }
}}

// CORRECT -- invalid value stays visible
onChange={(e) => {
  const val = e.target.value;
  setMyField(val); // always runs first

  if (val !== "" && (Number(val) < 0 || Number(val) > maxValue)) {
    setMyFieldError("Value must be between 0 and X.");
  } else {
    setMyFieldError("");
  }
}}
```

When auditing or writing a new calculator, check every `onChange` handler for a setter wrapped inside a conditional and pull it out to the top.

---

## 2. Input Cleanup (Numeric Fields)

Strip leading zeros on numeric inputs so `007` becomes `7`, while still allowing `0.8` or `.8`:

```ts
const stripped = val.replace(/^0+(?=\d)/, "");
```

For period/count fields (not currency), cap decimal input to 2 places as the user types:

```ts
const cleaned = stripped.replace(/(\.\d{2})\d+/, "$1");
```

Auto-add a leading zero on blur if the user typed a bare decimal like `.8`:

```tsx
onBlur={(e) => {
  if (e.target.value.startsWith(".")) {
    setMyField("0" + e.target.value);
  }
}}
```

---

## 3. Input Icons ($ and %)

Every input that accepts a dollar amount displays a slightly gray `$` on the left side as a permanent fixture. It is always visible, not just on focus.

Every input that accepts a percentage displays a `%` inside the input on the right side, also as a permanent fixture.

In dark mode both icons must use a lighter color. The default dark gray is not readable against the dark background.

These icons are part of the input's base layout, not conditional state. The mortgage calculator is the established reference for how the `$` placement should look.

---

## 4. Error State Styling

CSS variable: `var(--color-inline-error)`

Each field gets a paired error state variable, e.g. `interestRateError`. The field shows a 2px red border and red text below when an error is active.

- Border: `border-[var(--color-inline-error)] border-2`
- Text: `style={{ color: "var(--color-inline-error)" }}`

Where multiple fields share the same input class, use extracted helpers:

```tsx
// Base classes shared by all inputs
const baseInputClass = "border-1 w-full rounded-md shadow-sm py-2 px-3 ...";

// Returns the error/warning border class
function inputStateClass(error: string, warning: string): string {
  if (error) return "border-[var(--color-inline-error)] border-2";
  if (warning) return "border-[var(--color-inline-warning)] border-2";
  return "";
}
```

---

## 5. Warning State Styling

CSS variable: `var(--color-inline-warning)`

The warning color token must resolve to a single color per theme, applied identically to both the border and the text. Using two different orange values for text and outline is a bug.

- Light mode: `#9A6207`
- Dark mode: `#C37C09`

Warnings are advisory states for technically valid but unusual values (e.g. a 0% interest rate, or a rate above 50%). They do not block calculation.

- Border: `border-[var(--color-inline-warning)] border-2`
- Text: `style={{ color: "var(--color-inline-warning)" }}`

**Error wins over warning.** The className ternary always checks error first:

```tsx
className={`${baseInputClass} ${
  interestRateError
    ? "border-[var(--color-inline-error)] border-2"
    : interestRateWarning
      ? "border-[var(--color-inline-warning)] border-2"
      : ""
}`}
```

Error and warning JSX blocks are independent siblings, not nested. Do not guard the warning block with `!errorState`. Both blocks live next to each other; the state logic keeps only one active at a time.

```tsx
{/* Independent siblings */}
{interestRateError && (
  <p style={{ color: "var(--color-inline-error)" }}>{interestRateError}</p>
)}
{interestRateWarning && (
  <p style={{ color: "var(--color-inline-warning)" }}>{interestRateWarning}</p>
)}
```

**Consistency rule:** Every field that has warning text must also have a matching amber border. If a field shows amber text but no amber outline, that is a bug.

---

## 6. Required Field Errors

Required fields fire their error message on `onBlur` (after the user leaves the field while it is empty). A 150ms deferred pattern is used so the error does not flash if the user is tabbing normally.

**Error message language:** All required field errors must start with "Please enter". Do not use a bare "Enter" without the "Please".

```
"Please enter an interest rate."      correct
"Please enter an initial amount."     correct
"Enter an initial amount."            wrong
```

Fields where an error appearing immediately on load would be jarring use a `touched` state. The error only appears after the user has interacted with the field at least once:

```tsx
const [yearsToRetirementTouched, setYearsToRetirementTouched] = useState(false);
```

---

## 7. Result Suppression (anyFieldEmpty)

When any required field is empty, the result panel shows `—` instead of computing with 0 for the blank fields.

Each tab has its own boolean guard derived from its required fields. Optional fields (e.g. `finalAmount` on Present Value) are explicitly excluded from the check.

```tsx
const singleAnyFieldEmpty =
  futureValue === "" || interestRate === "" || periods === "";

const singleHasError =
  singleAnyFieldEmpty || !!futureValueError || !!interestRateError || !!periodsError;
```

In the result display:

```tsx
<p>{singleHasError ? "—" : formatCurrency(result)}</p>
```

---

## 8. Skip Detection

Skip detection flags a required field as errored when the user jumps past it (interacts with a later field while an earlier one is still empty). It is implemented using a `FIELD_ORDER` array and a `flagSkippedFields` helper.

This pattern is applied to the Compounding Frequency calculator and is available to port to other calculators. Not all calculators currently have it.

```tsx
const FIELD_ORDER = ["principal", "interestRate", "periods"] as const;

function flagSkippedFields(
  currentField: string,
  values: Record<string, string>,
  setErrors: Record<string, (msg: string) => void>
) {
  const currentIndex = FIELD_ORDER.indexOf(currentField as typeof FIELD_ORDER[number]);
  FIELD_ORDER.slice(0, currentIndex).forEach((field) => {
    if (values[field] === "") {
      setErrors[field](`Please enter a ${field}.`);
    }
  });
}
```

---

## 9. Large Number Display

Results use abbreviated formatting once values reach the millions range.

- Under $1M: standard `Intl.NumberFormat` currency format, always 2 decimal places
- $1M and up: abbreviated with M, B, or T suffix, 2 decimal places by default
- Above `1e15` (past trillions): render as `"Too large to display"`, never scientific notation

When two paired values (e.g. final balance and interest accrued) would render identically in abbreviated form, extend both to 3 decimal places, then 4 if still identical. Cap at 4. Both values in a pair always render at the same decimal count.

```ts
function formatCurrency(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return "-";
  if (value >= 1e15) return "Too large to display";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(decimals)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(decimals)}M`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

When either value in a pair is `"Too large to display"`, show a hint line once, under the first result only:

```
Try a lower rate or fewer periods.
```

The hint is styled with `var(--color-inline-error)` and only appears when there is no validation error (i.e. the inputs are valid but the output is out of displayable range).

In comparison tables, each row is its own pair. The decimal extension rule is applied row-by-row.

---

## 10. Zero-Rate Math Fallback

When performing time-value-of-money calculations, the zero-rate fallback must use `=== 0`, not `<= 0`.

Using `<= 0` incorrectly applies simple multiplication (principal x periods) for negative rates, when the present value annuity formula should still be used. Zero is the only case where the formula breaks down and simple multiplication is the correct fallback.

```ts
// WRONG
if (rate <= 0) return principal * periods;

// CORRECT
if (rate === 0) return principal * periods;
```

---

## 11. Dynamic Period Labels in Error Messages

On calculators with a compounding frequency selector, range error messages use the appropriate period label for the selected frequency rather than the generic word "periods."

```ts
const periodPluralLabels: Record<CompoundingFrequency, string> = {
  annually: "years",
  "semi-annually": "semi-annual periods",
  quarterly: "quarters",
  monthly: "months",
  biweekly: "bi-weekly periods",
  weekly: "weeks",
  daily: "days",
};

// Example output for weekly:
// "Please enter a number of weeks between 0 and 5,200. (5,200 weeks = 100 years with weekly compounding)"
```

---

## 12. Sign Helper Text

On calculators where sign (positive/negative) matters for inputs, a helper line appears below the field once the user begins typing:

```
Money you pay out is negative; money you receive is positive.
```

Define this as a reusable constant:

```ts
const SIGN_HELPER = "Money you pay out is negative; money you receive is positive.";
```

Render it conditionally based on field value:

```tsx
{fieldValue !== "" && (
  <p className="text-sm text-muted-foreground mt-1">{SIGN_HELPER}</p>
)}
```

---

## 13. Reset Button

Every calculator has a Reset button. Use the shared `Button` component:

```tsx
<Button variant="lagunita" size="sm" onClick={handleReset}>
  Reset
</Button>
```

On reset, all of the following must clear:

- Field values (back to empty strings or initial defaults)
- Error state strings
- Warning state strings
- Touched state (if used)
- Results (back to `—`)

---

## 14. Tooltips

All tooltips use the shared `InfoPopover` component. Do not use a custom tooltip implementation.

Tooltip titles are not displayed visually. The title must be present for screen readers but hidden using `sr-only`:

```tsx
<InfoPopover
  title={<span className="sr-only">Compounding frequency</span>}
  description="How often interest is applied to the balance."
/>
```

The visible tooltip contains the description only.

---

## 15. Code Comments

Every calculator file has function-level comments. The intent is to orient a new reader to what each block does, not to re-explain the logic line by line. Single-line comments inside components, block comments above standalone functions and helpers.

---

## Summary Table

| Rule | Pattern / Key |
|---|---|
| Setter always called | `setMyField(val)` before any conditional |
| $ icon | Permanent left fixture on all dollar inputs |
| % icon | Permanent right fixture on all rate inputs |
| Dark mode icons | Lighter color; dark gray is not readable |
| Error border | `border-[var(--color-inline-error)] border-2` |
| Warning border | `border-[var(--color-inline-warning)] border-2` |
| Warning color (light) | `#9A6207` for both text and border |
| Warning color (dark) | `#C37C09` for both text and border |
| Error wins over warning | Error checked first in ternary |
| Error + warning are siblings | Not nested, not mutually gated |
| Required error language | Always starts with "Please enter" |
| Empty field result | Show `—`, not computed value |
| Too-large result | Show `"Too large to display"` at `>= 1e15` |
| Abbreviated pair decimals | Extend 2 -> 3 -> 4 until values differ |
| Zero-rate fallback | `=== 0`, not `<= 0` |
| Reset clears | Values, errors, warnings, touched, results |
| Tooltips | `InfoPopover` component; title is `sr-only`, description is visible |