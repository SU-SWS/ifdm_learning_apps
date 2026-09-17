type CalculationMode = "monthly-savings" | "time-to-goal" | "future-balance";

export interface FieldErrors {
  savingsGoal?: string;
  currentBalance?: string;
  timeYears?: string;
  timeMonths?: string;
  interestRate?: string;
  contributionPerPeriod?: string;
}

export interface FieldInfo {
  [key: string]: string;
}

export interface FieldWarnings {
  [key: string]: string;
}

export interface ValidationResult {
  errors: FieldErrors;
  info: FieldInfo;
  warnings: FieldWarnings;
  hasBlockingErrors: boolean;
}

const GOAL_REACHED_WARNING =
  "You've already reached this goal. Your current balance meets or exceeds your target.";

/**
 * Validate savings goal amount ($1 - $1,000,000,000)
 * Only shown in Tab 1 & 2, not in Tab 3 (future-balance)
 */
export function validateSavingsGoal(
  value: number,
  currentBalance: number,
  touched: boolean,
  mode: CalculationMode,
  isFocused = false
): { error?: string; info?: string; warning?: string } {
  if (mode === "future-balance") return {};

  // Do not interrupt someone who is clearing a previously completed field.
  // The required-value error appears when they finish editing and leave it.
  if (touched && value === 0 && isFocused) {
    return {};
  }

  if (touched && (value === 0 || value < 1 || value > 1000000000)) {
    return { error: "Enter an amount between $1 and $1,000,000,000" };
  }

  if (
    value > 0 &&
    value <= 1000000000 &&
    currentBalance <= 1000000000 &&
    value <= currentBalance
  ) {
    return { warning: GOAL_REACHED_WARNING };
  }

  return {};
}

/**
 * Validate current savings balance ($0 - $1,000,000,000)
 * Used in all tabs
 */
export function validateCurrentBalance(
  value: number,
  touched: boolean
): { error?: string } {
  // Allow negative input to show, but show error
  if (touched && value < 0) {
    return { error: "Enter an amount between $0 and $1,000,000,000" };
  }

  if (value > 1000000000) {
    return { error: "Enter an amount between $0 and $1,000,000,000" };
  }

  return {};
}

/**
 * Validate time period - years (0 - 100 years)
 * Used in Tab 1 & 3 (not Tab 2)
 */
export function validateTimeYears(
  years: number,
  months: number,
  touched: boolean,
  mode: CalculationMode
): { error?: string } {
  if (mode === "time-to-goal") return {};

  if (years < 0 || years > 100) {
    return { error: "Enter a number of years between 0 and 100." };
  }

  // Check if both years and months are 0
  if (touched && years === 0 && months === 0) {
    return { error: "Please enter a time period greater than 0." };
  }

  return {};
}

/**
 * Validate time period - months (0 - 11 months)
 * Used in Tab 1 & 3 (not Tab 2)
 */
export function validateTimeMonths(
  years: number,
  months: number,
  touched: boolean,
  mode: CalculationMode
): { error?: string } {
  if (mode === "time-to-goal") return {};

  if (months < 0 || months > 11) {
    return { error: "Enter a number of months between 0 and 11" };
  }

  // Check if both years and months are 0
  if (touched && years === 0 && months === 0) {
    return { error: "Please enter a time period greater than 0." };
  }

  return {};
}

/**
 * Validate contribution per period ($0 - $100,000,000)
 * Used in Tab 2 & 3 (not Tab 1)
 */
export function validateContributionPerPeriod(
  value: number,
  touched: boolean,
  mode: CalculationMode
): { error?: string } {
  if (mode === "monthly-savings") return {};

  if (value < 0) {
    return { error: "Enter an amount between $0 and $100,000,000" };
  }

  if (value > 100000000) {
    return { error: "Enter an amount between $0 and $100,000,000" };
  }

  return {};
}

/**
 * Validate annual interest rate (0% - 30%)
 * Used in all tabs
 * Special case: 0% is allowed and shows an advisory message
 */
export function validateInterestRate(
  value: number,
  touched: boolean,
  isFocused?: boolean,
  mode?: CalculationMode
): { error?: string; info?: string; warning?: string } {
  // Check for sentinel value (-1 = empty field) first, before range check
  if (value === -1) {
    if (touched) {
      // For time-to-goal tab, defer error while editing. For other tabs, show immediately.
      if (mode === "time-to-goal" && isFocused) {
        return {};
      }
      return { error: "Please enter an annual interest rate." };
    }
    // Not touched yet, so don't show error
    return {};
  }

  if (value < 0 || value > 30) {
    return { error: "Enter a rate between 0% and 30%" };
  }

  if (value === 0) {
    const message = "At 0%, your balance grows only from deposits. No interest is earned.";

    if (mode === "monthly-savings") {
      return { warning: message };
    }

    return {
      info: message,
    };
  }

  return {};
}

/**
 * Validate all fields based on current mode and touched state
 * Returns consolidated errors, info messages, and blocking error flag
 */
export function validateAllFields(
  state: {
    savingsGoal: number;
    currentBalance: number;
    timeYears: number;
    timeMonths: number;
    interestRate: number;
    contributionPerPeriod: number;
  },
  touched: Record<string, boolean>,
  mode: CalculationMode,
  focusedField?: string | null
): ValidationResult {
  const errors: FieldErrors = {};
  const info: FieldInfo = {};
  const warnings: FieldWarnings = {};

  // Validate savings goal
  const savingsGoalValidation = validateSavingsGoal(
    state.savingsGoal,
    state.currentBalance,
    touched.savingsGoal || false,
    mode,
    focusedField === "savingsGoal"
  );
  if (savingsGoalValidation.error) errors.savingsGoal = savingsGoalValidation.error;
  if (savingsGoalValidation.info) info.savingsGoal = savingsGoalValidation.info;
  if (savingsGoalValidation.warning) warnings.savingsGoal = savingsGoalValidation.warning;

  // Validate current balance
  const currentBalanceValidation = validateCurrentBalance(
    state.currentBalance,
    touched.currentBalance || false
  );
  if (currentBalanceValidation.error) errors.currentBalance = currentBalanceValidation.error;

  const hasReachedGoal =
    mode !== "future-balance" &&
    state.savingsGoal > 0 &&
    state.savingsGoal <= 1000000000 &&
    state.currentBalance <= 1000000000 &&
    state.savingsGoal <= state.currentBalance;

  if (hasReachedGoal) {
    warnings.currentBalance = GOAL_REACHED_WARNING;

    return {
      errors,
      info,
      warnings,
      hasBlockingErrors: true,
    };
  }

  // Validate time years
  const timeYearsValidation = validateTimeYears(
    state.timeYears,
    state.timeMonths,
    touched.timeYears || false,
    mode
  );
  if (timeYearsValidation.error) errors.timeYears = timeYearsValidation.error;

  // Validate time months
  const timeMonthsValidation = validateTimeMonths(
    state.timeYears,
    state.timeMonths,
    touched.timeMonths || false,
    mode
  );
  if (timeMonthsValidation.error) errors.timeMonths = timeMonthsValidation.error;

  // Validate contribution per period
  const contributionValidation = validateContributionPerPeriod(
    state.contributionPerPeriod,
    touched.contributionPerPeriod || false,
    mode
  );
  if (contributionValidation.error) errors.contributionPerPeriod = contributionValidation.error;

  // Special case: Time to Goal tab - block if both currentBalance and contributionPerPeriod are 0
  // Only show error after user has touched AND finished editing one of these fields
  if (
    mode === "time-to-goal" &&
    state.currentBalance === 0 &&
    state.contributionPerPeriod === 0 &&
    (touched.currentBalance || touched.contributionPerPeriod) &&
    focusedField !== "currentBalance" &&
    focusedField !== "contributionPerPeriod"
  ) {
    errors.contributionPerPeriod = "Enter a savings amount or contribution to calculate time to goal.";
  }

  // Special case: Time to Goal tab - warning if contribution per period meets or exceeds savings goal
  if (
    mode === "time-to-goal" &&
    state.savingsGoal > 0 &&
    state.contributionPerPeriod > 0 &&
    state.contributionPerPeriod >= state.savingsGoal
  ) {
    warnings.contributionPerPeriod = "You've already reached this goal. The amount entered in saving per compounding period meets or exceeds your target.";
  }

  // Special case: Time to Goal tab - at 0% interest with no contributions, block calculation
  if (
    mode === "time-to-goal" &&
    state.interestRate === 0 &&
    state.savingsGoal > state.currentBalance &&
    state.currentBalance > 0 &&
    state.contributionPerPeriod === 0
  ) {
    warnings.interestRate = "At 0%, your balance grows only from deposits. Since no contributions are entered you will not reach your goal.";
    // Clear the info message since we're showing a blocking warning instead
    delete info.interestRate;
  }

  // Validate interest rate
  const interestRateValidation = validateInterestRate(
    state.interestRate,
    touched.interestRate || false,
    focusedField === "interestRate",
    mode
  );
  if (interestRateValidation.error) errors.interestRate = interestRateValidation.error;
  if (interestRateValidation.warning) warnings.interestRate = interestRateValidation.warning;
  // Only show the info message if we don't have a blocking warning for this field
  if (interestRateValidation.info && !warnings.interestRate) info.interestRate = interestRateValidation.info;

  // For time-to-goal mode, the remaining warnings are also blocking
  const hasWarningsThatBlock = mode === "time-to-goal" && Object.keys(warnings).length > 0;
  const hasFocusedEmptySavingsGoal =
    mode !== "future-balance" &&
    state.savingsGoal === 0 &&
    (touched.savingsGoal || false) &&
    focusedField === "savingsGoal";

  return {
    errors,
    info,
    warnings,
    hasBlockingErrors:
      Object.keys(errors).length > 0 ||
      hasWarningsThatBlock ||
      hasFocusedEmptySavingsGoal,
  };
}
