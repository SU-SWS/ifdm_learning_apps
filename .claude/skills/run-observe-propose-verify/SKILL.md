---
name: run-observe-propose-verify
description: >-
  A disciplined loop for diagnosing bugs and validating changes: Run the code,
  Observe the actual behavior, Propose a minimal fix rooted in evidence, then
  Verify the fix by re-running and comparing against a known-good baseline. Use
  when debugging unexpected behavior, changing financial math or validation
  logic, or before calling any nontrivial change "done" — especially in this
  repo, which has no automated test suite and relies on manual verification. Do
  NOT use for feature requests, refactors, or style/copy changes with no
  reported malfunction.
---

# Run, Observe, Propose, Verify (ROPV)

A four-phase loop for changing code with confidence. The rule is simple: **never
propose a fix from a theory alone, and never call a change done without
re-observing it.** Evidence bookends every change.

This repo has no test suite (see `CLAUDE.md`) and its financial math is a
sensitive surface with a history of edge-case regressions. That makes the
observe/verify halves non-optional here, not ceremony.

## When to use

- A calculator produces wrong or surprising numbers.
- You're editing financial math, a solver, validation rules, or currency/input
  handling.
- You've made any nontrivial change and are about to say it works.
- You're reviewing someone else's change and want to confirm the claimed effect.

Skip it for pure copy/styling tweaks with no runtime behavior to observe.

## The loop

### 1. Run
Get the code executing so you can see real behavior, not imagined behavior.

- `yarn dev` and open the affected calculator in the browser, OR
- `yarn build:local` to confirm it compiles, and `yarn lint`.
- Reproduce the exact scenario in question: the specific inputs, frequency,
  edge value (zero rate, very high rate, cross-compounding frequency, empty
  field).

Write down the inputs you used. A repro you can't restate is not a repro.

If you **cannot** reproduce the symptom, say so explicitly and ask the user for
more detail (browser, console output, screenshot, exact inputs) rather than
guessing. Do not propose a fix for a bug you haven't seen.

### 2. Observe
Record what actually happens, precisely — before forming any theory.

- Capture the actual output (the number, the date, the error).
- Capture what you *expected* and where that expectation comes from (a
  hand-calculation, another calculator, a known-good commit).
- Note the delta. "Bi-weekly total interest is ~8% high" is an observation;
  "the divisor is wrong" is already a guess — keep them separate.
- Localize: does it affect one frequency or all? One tab or both? That narrows
  cause to a shared helper vs. per-file logic. In these calculators, each
  `app/interactives/<name>/page.tsx` owns its own math — a bug in one usually
  does **not** exist in the others; confirm per file.

### 3. Propose
Only now form a fix, and make it the smallest change that the observation
justifies.

- State one specific, falsifiable root-cause hypothesis, tied to the observed
  delta — something a re-run can prove wrong, not a vague "probably rounding."
- Prefer a one-line/one-value fix over a rewrite. If the fix is large, your
  diagnosis is probably incomplete — go back to Observe.
- Predict, out loud, what the corrected output should be *before* you run it.
- Check whether the same root cause appears in sibling calculators; fix each
  only after confirming it's actually present there (don't assume).

### 4. Verify
Re-run and confirm the prediction. This closes the loop.

- Re-run the exact repro from step 1. Confirm the new output matches the
  predicted value, not just "looks different."
- Test the boundaries around it: zero, very large, empty input, the adjacent
  compounding frequencies, both tabs.
- Confirm you didn't regress the cases that were already correct.
- Re-run `yarn lint` (and `yarn build:local` if you touched more than one file).
- Report faithfully: state the before/after numbers and the exact inputs. If a
  case still fails or you skipped a check, say so.

### If verification fails
Do not silently retry a new guess. Stop, report what Verify actually showed, and
treat that output as **new evidence for another Observe pass**. Each iteration
ends with a report to the user, not a silent loop.

## Reporting template

```
Repro:     <exact inputs / scenario>
Observed:  <actual output>  (expected <value> from <source>)
Cause:     <one sentence, tied to the delta>
Fix:       <file:line, minimal change>
Verified:  <re-run output = predicted>; boundaries checked: <list>
```

## Anti-patterns

- Proposing a fix before running the code ("this should be it" — verify it *is*).
- Verifying only the one case you fixed and declaring victory.
- A large refactor offered as a bug fix — a symptom of a skipped Observe phase.
- Assuming a fix in one calculator applies to the `-v2` or sibling versions
  without checking each file.
- Calling it done on a green compile alone; compiling is not behaving.
