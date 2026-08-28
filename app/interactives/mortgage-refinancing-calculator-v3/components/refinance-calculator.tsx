"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Info,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  monthlyRate,
  presentValueOfPayments,
  paymentFromLoan,
  discountFactor,
  formatCurrency,
} from "../lib/mortgage";
import { validate, type FieldName, type Validation } from "../lib/validation";
import { Button } from "@/app/ui/components/button";

type Tab = "current" | "refinance";

/** No field has been entered and left yet on first render. */
const NO_FIELDS_TOUCHED: Record<FieldName, boolean> = {
  months: false,
  currentRate: false,
  monthlyPayment: false,
  newAmount: false,
  newTerm: false,
  newRate: false,
  closingCosts: false,
  years: false,
};

/** Shown in place of a number whenever an input it depends on is unusable. */
const DASH = "—";

// All fields start blank so the user enters their own loan details. Optional
// fields (closing costs, expected years) being blank also drives the simpler
// lifetime payment comparison instead of a present-value analysis.
const DEFAULT_MONTHS = "";
const DEFAULT_CURRENT_RATE = "";
const DEFAULT_MONTHLY_PAYMENT = "";

const DEFAULT_NEW_TERM = "";
const DEFAULT_NEW_RATE = "";
const DEFAULT_CLOSING = "";
const DEFAULT_YEARS = "";

function num(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** True when an optional numeric field has a usable, positive value. */
function hasValue(value: string): boolean {
  return value.trim() !== "" && num(value) > 0;
}

/**
 * Format a raw input string with thousands separators as the user types while
 * preserving a trailing decimal point and decimal digits (e.g. "5000" ->
 * "5,000", "1234.5" -> "1,234.5"). Invalid characters are stripped.
 */
function formatThousands(raw: string): string {
  let cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned === "") return "";
  const [intPart, decPart] = cleaned.split(".");
  const intFormatted = intPart ? Number(intPart).toLocaleString("en-US") : "";
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

export function RefinanceCalculator() {
  const [tab, setTab] = useState<Tab>("current");

  // Current balance inputs
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [currentRate, setCurrentRate] = useState(DEFAULT_CURRENT_RATE);
  const [monthlyPayment, setMonthlyPayment] = useState(DEFAULT_MONTHLY_PAYMENT);

  // Refinance inputs
  const [newAmount, setNewAmount] = useState("");
  const [newTerm, setNewTerm] = useState(DEFAULT_NEW_TERM);
  const [newRate, setNewRate] = useState(DEFAULT_NEW_RATE);
  const [closingCosts, setClosingCosts] = useState(DEFAULT_CLOSING);
  const [years, setYears] = useState(DEFAULT_YEARS);

  // Whether the user has run the analysis. Results stay hidden until pressed.
  const [analyzed, setAnalyzed] = useState(false);

  // Validation UI state. `touched` defers required-field messages until the
  // user has entered and left a field; `focusedField` hides them again while
  // that field is being edited.
  const [touched, setTouched] =
    useState<Record<FieldName, boolean>>(NO_FIELDS_TOUCHED);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function markTouched(field: FieldName) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  // Debounced snapshot of the calculation inputs, updated 300ms after typing
  // pauses. handleAnalyze/resetCurrent/resetNewLoan flush it immediately.
  const [debounced, setDebounced] = useState({
    months,
    currentRate,
    monthlyPayment,
    newAmount,
    newTerm,
    newRate,
    closingCosts,
    years,
  });
  useEffect(() => {
    const t = setTimeout(
      () =>
        setDebounced({
          months,
          currentRate,
          monthlyPayment,
          newAmount,
          newTerm,
          newRate,
          closingCosts,
          years,
        }),
      300,
    );
    return () => clearTimeout(t);
  }, [
    months,
    currentRate,
    monthlyPayment,
    newAmount,
    newTerm,
    newRate,
    closingCosts,
    years,
  ]);

  // --- Current balance ---
  const currentBalance = useMemo(() => {
    const r = monthlyRate(num(debounced.currentRate));
    return presentValueOfPayments(
      num(debounced.monthlyPayment),
      r,
      num(debounced.months),
    );
  }, [debounced]);

  // New loan amount is whatever the user enters (no default prefill).
  const effectiveNewAmount = num(newAmount);
  const debouncedNewAmount = num(debounced.newAmount);

  const hasYears = hasValue(debounced.years);
  const hasClosing = hasValue(debounced.closingCosts);

  // One source of truth for every error message and blocking flag, read by both
  // the result panel and the comparison table so the output can never show a
  // number next to an error. Deliberately validates the raw input strings
  // rather than the debounced snapshot, so errors track the current keystroke
  // instead of lagging 300ms behind it.
  const v = useMemo(
    () =>
      validate(
        {
          months,
          currentRate,
          monthlyPayment,
          newAmount,
          newTerm,
          newRate,
          closingCosts,
          years,
        },
        { touched, focusedField, analyzed },
      ),
    [
      months,
      currentRate,
      monthlyPayment,
      newAmount,
      newTerm,
      newRate,
      closingCosts,
      years,
      touched,
      focusedField,
      analyzed,
    ],
  );

  // --- Refinance analysis ---
  // Single net-present-value formula for every case:
  //   NPV = PV(monthly savings over the horizon)
  //       + PV(difference in remaining balances at the horizon)
  //       − closing costs
  // Everything is discounted to today at the new interest rate. When the user
  // gives an expected length of stay we use it as the horizon; otherwise we
  // default the horizon to the SHORTER of the two loan terms (min), the window
  // where both loans are still being paid. That default correctly prices both
  // extending the loan (old loan paid off, new loan still carries a balance ⇒
  // penalized) and shortening it (new loan paid off, old loan still owes ⇒
  // credited) without asking the user for a horizon.
  const analysis = useMemo(() => {
    const rOld = monthlyRate(num(debounced.currentRate));
    const rNew = monthlyRate(num(debounced.newRate));
    const oldMonths = num(debounced.months);
    const nNew = num(debounced.newTerm);
    const oldPmt = num(debounced.monthlyPayment);
    const closing = hasClosing ? num(debounced.closingCosts) : 0;

    const newPayment = paymentFromLoan(debouncedNewAmount, rNew, nNew);
    const monthlySavings = oldPmt - newPayment;

    const npvAtMonths = (sm: number) => {
      const h = Math.max(0, sm);
      // The payment difference is (old payment − new payment) only while BOTH
      // loans are still being paid. Once the shorter-term loan ends, its
      // payment drops to $0 while the other loan's payment keeps going, so we
      // walk the horizon in two segments instead of truncating at the shorter
      // loan's term: an "overlap" segment where both payments apply, then a
      // "tail" segment (a deferred annuity) where only the longer-term loan's
      // payment continues, up through the horizon or that loan's own term end.
      const overlapMonths = Math.min(h, oldMonths, nNew);
      const tailEnd = Math.min(h, Math.max(oldMonths, nNew));
      const tailMonths = Math.max(0, tailEnd - overlapMonths);
      const tailPmt = oldMonths > nNew ? oldPmt : -newPayment;
      const pvOverlap = presentValueOfPayments(
        monthlySavings,
        rNew,
        overlapMonths,
      );
      const pvTail =
        presentValueOfPayments(tailPmt, rNew, tailMonths) *
        discountFactor(rNew, overlapMonths);
      const pvSav = pvOverlap + pvTail;

      const oldRemaining = presentValueOfPayments(oldPmt, rOld, oldMonths - h);
      const newRemaining = presentValueOfPayments(newPayment, rNew, nNew - h);
      const pvDiff = (oldRemaining - newRemaining) * discountFactor(rNew, h);
      return {
        pvSavings: pvSav,
        pvDiffBalance: pvDiff,
        overall: pvSav + pvDiff - closing,
      };
    };

    const defaultHorizon = Math.min(oldMonths, nNew);
    const horizonMonths = hasYears ? num(debounced.years) * 12 : defaultHorizon;

    const here = npvAtMonths(horizonMonths);

    return {
      newPayment,
      monthlySavings,
      pvSavings: here.pvSavings,
      pvDiffBalance: here.pvDiffBalance,
      overallBenefit: here.overall,
      horizonMonths,
      usedDefaultHorizon: !hasYears,
      newTermMonths: nNew,
      closing,
    };
  }, [debounced, debouncedNewAmount, hasClosing, hasYears]);

  // Reset clears values, error state and results together — a reset field must
  // not keep showing the message it had before it was cleared.
  function resetCurrent() {
    setMonths(DEFAULT_MONTHS);
    setCurrentRate(DEFAULT_CURRENT_RATE);
    setMonthlyPayment(DEFAULT_MONTHLY_PAYMENT);
    setDebounced((d) => ({
      ...d,
      months: DEFAULT_MONTHS,
      currentRate: DEFAULT_CURRENT_RATE,
      monthlyPayment: DEFAULT_MONTHLY_PAYMENT,
    }));
    setTouched((t) => ({
      ...t,
      months: false,
      currentRate: false,
      monthlyPayment: false,
    }));
    setAnalyzed(false);
  }

  function resetNewLoan() {
    setNewAmount("");
    setNewTerm(DEFAULT_NEW_TERM);
    setNewRate(DEFAULT_NEW_RATE);
    setClosingCosts(DEFAULT_CLOSING);
    setYears(DEFAULT_YEARS);
    setDebounced((d) => ({
      ...d,
      newAmount: "",
      newTerm: DEFAULT_NEW_TERM,
      newRate: DEFAULT_NEW_RATE,
      closingCosts: DEFAULT_CLOSING,
      years: DEFAULT_YEARS,
    }));
    setTouched((t) => ({
      ...t,
      newAmount: false,
      newTerm: false,
      newRate: false,
      closingCosts: false,
      years: false,
    }));
    setAnalyzed(false);
  }

  function handleAnalyze() {
    setDebounced({
      months,
      currentRate,
      monthlyPayment,
      newAmount,
      newTerm,
      newRate,
      closingCosts,
      years,
    });
    setAnalyzed(true);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-4 [&_button]:cursor-pointer">
        <TabButton active={tab === "current"} onClick={() => setTab("current")}>
          Current Balance
        </TabButton>
        <TabButton
          active={tab === "refinance"}
          onClick={() => setTab("refinance")}
        >
          Refinance Analysis
        </TabButton>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Left column */}
        <div>
          {tab === "current" ? (
            <CurrentBalanceForm
              months={months}
              setMonths={setMonths}
              currentRate={currentRate}
              setCurrentRate={setCurrentRate}
              monthlyPayment={monthlyPayment}
              setMonthlyPayment={setMonthlyPayment}
              validation={v}
              onFocusField={setFocusedField}
              onBlurField={(field) => {
                markTouched(field);
                setFocusedField(null);
              }}
              onReset={resetCurrent}
            />
          ) : (
            <RefinanceForm
              onEditBalance={() => setTab("current")}
              newAmount={newAmount}
              setNewAmount={setNewAmount}
              newTerm={newTerm}
              setNewTerm={setNewTerm}
              newRate={newRate}
              setNewRate={setNewRate}
              closingCosts={closingCosts}
              setClosingCosts={setClosingCosts}
              years={years}
              setYears={setYears}
              validation={v}
              onFocusField={setFocusedField}
              onBlurField={(field) => {
                markTouched(field);
                setFocusedField(null);
              }}
              onReset={resetNewLoan}
            />
          )}
        </div>

        {/* Right column: result panel */}
        <div>
          {tab === "current" ? (
            <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
              <p className="text-panel-foreground/70">
                Estimated current balance
              </p>
              {/* Suppressed rather than computed from zero-coerced blanks. */}
              <p className="mt-1 text-4xl font-bold text-primary">
                {v.currentBlocking ? DASH : formatCurrency(currentBalance)}
              </p>
              <Button
                type="button"
                onClick={() => setTab("refinance")}
                variant="lagunita"
                className="mt-5 whitespace-normal cursor-pointer flex flex-row items-center gap-2 font-medium px-8"
              >
                Continue to refinance analysis
              </Button>
            </div>
          ) : (
            <ResultPanel
              analysis={analysis}
              showAnalysis={analyzed && !v.refiBlocking}
              validation={v}
              hasClosing={hasClosing}
              onAnalyze={handleAnalyze}
              onEditBalance={() => setTab("current")}
              current={{
                balance: currentBalance,
                months: num(months),
                rate: num(currentRate),
                payment: num(monthlyPayment),
              }}
              next={{
                balance: effectiveNewAmount,
                months: num(newTerm),
                rate: num(newRate),
                payment: analysis.newPayment,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-4 text-center  font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/40 bg-card text-primary hover:bg-primary/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ----------------------------- Field primitives ---------------------------- */

/** Focus/blur reporting shared by every field, used to drive `touched`. */
type FieldFocusProps = {
  validation: Validation;
  onFocusField: (field: FieldName) => void;
  onBlurField: (field: FieldName) => void;
};

/**
 * Label + input + hint + inline error for one numeric field. The `id` ties the
 * label, hint and error text to the input so screen readers announce all three,
 * and the error message and border are both driven off the shared validation
 * result — there is no per-field error state to fall out of sync.
 */
function NumberField({
  field,
  label,
  value,
  onChange,
  hint,
  prefix,
  suffix,
  placeholder,
  info,
  validation,
  onFocusField,
  onBlurField,
}: FieldFocusProps & {
  field: FieldName;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  info?: boolean;
}) {
  const id = `refi-${field}`;
  const error = validation.messages[field];
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 font-semibold text-foreground"
      >
        {label}
        {info ? (
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
        ) : null}
      </label>

      <div
        className={[
          "flex items-center rounded-md bg-card px-3 focus-within:ring-2 focus-within:ring-primary/30",
          error
            ? "border-2 border-[var(--color-inline-error)]"
            : "border border-input focus-within:border-primary",
        ].join(" ")}
      >
        {prefix ? <span className="mr-2">{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          // The setter is unconditional: an out-of-range value stays visible in
          // the field so the user keeps the context of what they typed.
          onChange={(e) => onChange(formatThousands(e.target.value))}
          onFocus={() => onFocusField(field)}
          onBlur={() => onBlurField(field)}
          className="w-full bg-transparent py-3 text-foreground outline-none"
        />
        {suffix ? <span className="ml-2">{suffix}</span> : null}
      </div>

      {hint ? (
        <p id={`${id}-hint`} className="text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-sm font-semibold text-[var(--color-inline-error)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function monthsHint(months: string): string | undefined {
  if (months.trim() === "" || num(months) <= 0) return undefined;
  const m = num(months);
  return `${m} months = ${(m / 12).toFixed(1)} years`;
}

/* ----------------------------- Current balance ----------------------------- */

function CurrentBalanceForm(
  props: FieldFocusProps & {
    months: string;
    setMonths: (v: string) => void;
    currentRate: string;
    setCurrentRate: (v: string) => void;
    monthlyPayment: string;
    setMonthlyPayment: (v: string) => void;
    onReset: () => void;
  },
) {
  const a11y = {
    validation: props.validation,
    onFocusField: props.onFocusField,
    onBlurField: props.onBlurField,
  };

  return (
    <div className="flex flex-col gap-6">
      <p className=" leading-relaxed ">
        Calculate your remaining mortgage balance (the present value of your
        remaining monthly mortgage payments).
      </p>

      <NumberField
        {...a11y}
        field="months"
        label="Months remaining on loan"
        value={props.months}
        onChange={props.setMonths}
        hint={monthsHint(props.months)}
        suffix="months"
      />

      <NumberField
        {...a11y}
        field="currentRate"
        label="Current interest rate"
        value={props.currentRate}
        onChange={props.setCurrentRate}
        suffix="%"
      />

      <NumberField
        {...a11y}
        field="monthlyPayment"
        label="Monthly payment amount"
        value={props.monthlyPayment}
        onChange={props.setMonthlyPayment}
        prefix="$"
      />

      <div>
        <Button
          type="button"
          onClick={props.onReset}
          variant="lagunita"
          className="whitespace-normal cursor-pointer flex flex-row items-center gap-2 font-medium px-8"
        >
          Reset <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Refinance --------------------------------- */

function RefinanceForm(
  props: FieldFocusProps & {
    onEditBalance: () => void;
    newAmount: string;
    setNewAmount: (v: string) => void;
    newTerm: string;
    setNewTerm: (v: string) => void;
    newRate: string;
    setNewRate: (v: string) => void;
    closingCosts: string;
    setClosingCosts: (v: string) => void;
    years: string;
    setYears: (v: string) => void;
    onReset: () => void;
  },
) {
  const a11y = {
    validation: props.validation,
    onFocusField: props.onFocusField,
    onBlurField: props.onBlurField,
  };

  return (
    <div className="flex flex-col gap-6">
      <p className=" leading-relaxed ">
        Analyze if refinancing makes financial sense for your situation.
      </p>

      {/* New loan terms */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-base font-semibold text-primary">
            New Loan Terms
          </h2>
          <Button
            type="button"
            onClick={props.onEditBalance}
            variant="ghost"
            className="mt-2 flex items-center gap-2  text-[var(--color-teal)] font-semibold hover:underline cursor-pointer"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Edit current loan
          </Button>
        </div>

        <NumberField
          {...a11y}
          field="newAmount"
          label="New loan amount"
          value={props.newAmount}
          onChange={props.setNewAmount}
          prefix="$"
        />

        <NumberField
          {...a11y}
          field="newTerm"
          label="New loan term (months)"
          value={props.newTerm}
          onChange={props.setNewTerm}
          hint={monthsHint(props.newTerm)}
          suffix="months"
        />

        <NumberField
          {...a11y}
          field="newRate"
          label="New interest rate"
          value={props.newRate}
          onChange={props.setNewRate}
          suffix="%"
        />
      </div>

      {/* Optional */}
      <div className="flex flex-col gap-5">
        <h2 className="border-b border-border pb-2 text-base font-semibold text-primary">
          Optional
        </h2>

        <NumberField
          {...a11y}
          field="closingCosts"
          label="Closing costs & fees"
          value={props.closingCosts}
          onChange={props.setClosingCosts}
          prefix="$"
          placeholder="Optional"
        />

        <NumberField
          {...a11y}
          field="years"
          label="Expected years living in house"
          value={props.years}
          onChange={props.setYears}
          suffix="years"
          placeholder="Optional"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={props.onReset}
          variant="lagunita"
          className="mt-5 whitespace-normal cursor-pointer flex flex-row items-center gap-2 font-medium px-8"
        >
          Reset new loan terms{" "}
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ Result panel ------------------------------- */

type LoanTerms = {
  balance: number;
  months: number;
  rate: number;
  payment: number;
};

function ResultPanel({
  analysis,
  showAnalysis,
  validation,
  hasClosing,
  onAnalyze,
  onEditBalance,
  current,
  next,
}: {
  analysis: {
    newPayment: number;
    monthlySavings: number;
    pvSavings: number;
    pvDiffBalance: number;
    overallBenefit: number;
    horizonMonths: number;
    usedDefaultHorizon: boolean;
    newTermMonths: number;
    closing: number;
  };
  showAnalysis: boolean;
  validation: Validation;
  hasClosing: boolean;
  onAnalyze: () => void;
  onEditBalance: () => void;
  current: LoanTerms;
  next: LoanTerms;
}) {
  const worthIt = analysis.overallBenefit >= 0;

  // Two-way verdict:
  //  - positive  → refinancing comes out ahead (green / primary)
  //  - negative  → refinancing does not come out ahead (red / destructive)
  const verdict: "positive" | "negative" = worthIt ? "positive" : "negative";
  const headline = worthIt
    ? "Refinancing may be worth it"
    : "Refinancing may not be worth it";
  const verdictColor =
    verdict === "positive"
      ? "text-primary"
      : "text-[var(--color-inline-error)]";

  return (
    <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
      {/* The refinance math depends on all three Current Balance inputs, so a
          problem over there has to be surfaced here — otherwise the analysis
          just silently disappears with the fix one tab away. */}
      {validation.currentBlocking ? (
        <div className="mb-6">
          <p
            role="alert"
            className="text-sm font-semibold text-[var(--color-inline-error)]"
          >
            Your current loan details are incomplete or out of range. Fix them to
            see your refinance analysis.
          </p>
          <Button
            type="button"
            onClick={onEditBalance}
            variant="ghost"
            className="mt-1 flex items-center gap-2 text-[var(--color-teal)] font-semibold hover:underline cursor-pointer"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Edit current loan
          </Button>
        </div>
      ) : null}

      {!showAnalysis ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
          {/* Deliberately not disabled: pressing it is what reveals the
              "Please enter…" messages on the empty required fields. */}
          <Button
            type="button"
            onClick={onAnalyze}
            variant="lagunita"
            className="w-full md:w-full flex flex-row items-center justify-center gap-2 whitespace-normal font-medium cursor-pointer"
          >
            Calculate results
          </Button>
          <p className="mt-1 text-sm text-panel-foreground/70">
            Fill in the new loan amount, term, rate, and any optional details,
            then press to calculate the results.
          </p>
        </div>
      ) : (
        <>
          {/* Hero: net value today */}
          <div>
            <p className=" font-medium text-panel-foreground/70">
              Net value today
            </p>
            <p
              className={[
                "text-4xl font-bold tracking-tight",
                verdictColor,
              ].join(" ")}
            >
              {analysis.overallBenefit < 0
                ? `−${formatCurrency(Math.abs(analysis.overallBenefit))}`
                : formatCurrency(analysis.overallBenefit)}
            </p>
            <p
              className={[
                "mt-2 flex items-center gap-1.5  font-semibold",
                verdictColor,
              ].join(" ")}
            >
              {verdict === "positive" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {headline}
            </p>
            <p className="mt-1  text-panel-foreground/70">
              {verdict === "positive"
                ? "Adjusted to today's dollars, refinancing comes out ahead."
                : "Adjusted to today's dollars, refinancing costs more than it saves."}
            </p>
          </div>
        </>
      )}

      {/* Current vs New side-by-side comparison */}
      <div className="mt-6">
        <LoanComparison
          current={current}
          next={next}
          validation={validation}
        />
      </div>

      {/* How this was calculated (equation-style breakdown) — after the terms table */}
      {showAnalysis ? (
        <CalculationBreakdown
          pvSavings={analysis.pvSavings}
          pvDiffBalance={analysis.pvDiffBalance}
          closing={hasClosing ? analysis.closing : 0}
          net={analysis.overallBenefit}
          hasClosing={hasClosing && analysis.closing > 0}
          hasYears={!analysis.usedDefaultHorizon}
        />
      ) : null}
    </div>
  );
}

/**
 * Side-by-side comparison of the current loan terms (carried over from the
 * Current Balance tab) against the proposed new loan terms.
 *
 * Each cell dashes independently, driven by whether the input it reads is
 * unusable (blank or out of range) rather than by whether it happens to be
 * zero. That keeps a valid 0% rate visible while still blanking a rate of 25%.
 */
function LoanComparison({
  current,
  next,
  validation,
}: {
  current: LoanTerms;
  next: LoanTerms;
  validation: Validation;
}) {
  const paymentDelta = next.payment - current.payment;
  const { bad, currentBlocking, refiBlocking } = validation;

  // The current balance is derived from all three Current Balance fields, and
  // the new payment from all of the refinance inputs, so those two cells use
  // the aggregate flags instead of a single field's.
  const dash = (unusable: boolean, text: string) => (unusable ? DASH : text);

  const rows: {
    label: string;
    cur: string;
    nxt: string;
    delta?: string;
    deltaGood?: boolean;
  }[] = [
    {
      label: "Current balance",
      cur: dash(currentBlocking, formatCurrency(current.balance)),
      nxt: dash(bad.newAmount, formatCurrency(next.balance)),
    },
    {
      label: "Months remaining",
      cur: dash(bad.months, `${current.months} mo`),
      nxt: dash(bad.newTerm, `${next.months} mo`),
    },
    {
      label: "Interest rate",
      cur: dash(bad.currentRate, `${current.rate}%`),
      nxt: dash(bad.newRate, `${next.rate}%`),
    },
    {
      label: "Monthly payment",
      cur: dash(bad.monthlyPayment, formatCurrency(current.payment)),
      nxt: dash(refiBlocking, formatCurrency(next.payment)),
      delta:
        !refiBlocking && !bad.monthlyPayment && paymentDelta !== 0
          ? `${paymentDelta < 0 ? "−" : "+"}${formatCurrency(Math.abs(paymentDelta))}/mo`
          : undefined,
      deltaGood: paymentDelta < 0,
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-border bg-muted/40">
        <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ">
          Terms
        </div>
        <div className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide ">
          Current loan terms
        </div>
        <div className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-primary">
          New loan terms
        </div>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={[
            "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center",
            i % 2 === 1 ? "bg-muted/20" : "",
          ].join(" ")}
        >
          <div className="px-4 py-3  ">{row.label}</div>
          <div className="px-4 py-3 text-right  font-medium text-foreground tabular-nums">
            {row.cur}
          </div>
          <div className="px-4 py-3 text-right tabular-nums">
            <div className=" font-bold text-foreground">{row.nxt}</div>
            {row.delta ? (
              <div
                className={[
                  "text-xs font-medium",
                  row.deltaGood
                    ? "text-primary"
                    : "text-[var(--color-inline-error)]",
                ].join(" ")}
              >
                {row.delta}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Expandable equation-style breakdown that mirrors the NPV formula line for
 * line. Rows that don't apply (zero equity difference on equal terms, or no
 * closing costs entered) are hidden so simple cases stay clean.
 */
function CalculationBreakdown({
  pvSavings,
  pvDiffBalance,
  closing,
  net,
  hasClosing,
  hasYears,
}: {
  pvSavings: number;
  pvDiffBalance: number;
  closing: number;
  net: number;
  hasClosing: boolean;
  hasYears: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Conditional explanation depending on which optional inputs the user provided.
  const explanation =
    hasClosing && hasYears
      ? "This analysis compares the net present value of the old loan's remaining cash flows to the new loan's remaining cash flows over the expected years living in the house, net of closing costs (assumed paid up front). The new loan's interest rate is used as the discount rate."
      : hasClosing
        ? "This analysis compares the net present value of the old loan's remaining cash flows to the new loan's remaining cash flows, net of closing costs (assumed paid up front). Loans are compared over the remaining term of the shortest loan. The new loan's interest rate is used as the discount rate."
        : hasYears
          ? "This analysis compares the net present value of the old loan's remaining cash flows to the new loan's remaining cash flows over the expected years living in the house. The new loan's interest rate is used as the discount rate."
          : "This analysis compares the net present value of the old loan's remaining cash flows to the new loan's remaining cash flows. Loans are compared over the remaining term of the shortest loan. The new loan's interest rate is used as the discount rate.";

  const rows: { label: string; value: number }[] = [
    { label: "PV of payment difference", value: pvSavings },
  ];
  // Only show the equity line when the terms differ (it's exactly 0 otherwise).
  if (Math.abs(pvDiffBalance) >= 0.005) {
    rows.push({ label: "PV of loan balance difference", value: pvDiffBalance });
  }
  if (closing > 0) {
    rows.push({ label: "Closing costs", value: -closing });
  }

  const signed = (v: number) =>
    `${v < 0 ? "−" : "+"}${formatCurrency(Math.abs(v))}`;

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left  font-semibold text-foreground transition-colors hover:bg-muted/40"
      >
        How this was calculated
        <ChevronDown
          className={[
            "h-4 w-4  transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="border-t border-border px-4 py-4">
          <div className="flex flex-col">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1.5 "
              >
                <span className="">{row.label}</span>
                <span
                  className={[
                    "tabular-nums font-medium",
                    row.value < 0
                      ? "text-[var(--color-inline-error)]"
                      : "text-foreground",
                  ].join(" ")}
                >
                  {signed(row.value)}
                </span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5 ">
              <span className="font-semibold text-foreground">
                Net value today
              </span>
              <span
                className={[
                  "tabular-nums text-base font-bold",
                  net < 0 ? "text-[var(--color-inline-error)]" : "text-primary",
                ].join(" ")}
              >
                {net < 0
                  ? `−${formatCurrency(Math.abs(net))}`
                  : formatCurrency(net)}
              </span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed ">{explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
