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

export interface ValidationResult {
  errors: FieldErrors;
  info: FieldInfo;
  hasBlockingErrors: boolean;
}

/**
 * Validate savings goal amount ($1 - $1,000,000,000)
 * Only shown in Tab 1 & 2, not in Tab 3 (future-balance)
 */
export function validateSavingsGoal(
  value: number,
  currentBalance: number,
  touched: boolean,
  mode: CalculationMode
): { error?: string; info?: string } {
  if (mode === "future-balance") return {};

  if (touched && value === 0) {
    return { error: "Please enter a savings goal amount." };
  }

  if (value !== 0 && (value < 1 || value > 1000000000)) {
    return { error: "Enter an amount between $1 and $1,000,000,000" };
  }

  if (value > 0 && value <= currentBalance) {
    return {
      info: "You've already reached this goal. Your current balance meets or exceeds your target.",
    };
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
 * Special case: 0% is allowed but shows info message
 */
export function validateInterestRate(
  value: number,
  touched: boolean
): { error?: string; info?: string } {
  if (touched && value === -1) {
    // -1 represents an emptied field
    return { error: "Please enter an annual interest rate." };
  }

  if (value < 0 || value > 30) {
    return { error: "Enter a rate between 0% and 30%" };
  }

  if (value === 0) {
    return {
      info: "At 0%, your balance grows only from deposits. No interest is earned.",
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
  mode: CalculationMode
): ValidationResult {
  const errors: FieldErrors = {};
  const info: FieldInfo = {};

  // Validate savings goal
  const savingsGoalValidation = validateSavingsGoal(
    state.savingsGoal,
    state.currentBalance,
    touched.savingsGoal || false,
    mode
  );
  if (savingsGoalValidation.error) errors.savingsGoal = savingsGoalValidation.error;
  if (savingsGoalValidation.info) info.savingsGoal = savingsGoalValidation.info;

  // Validate current balance
  const currentBalanceValidation = validateCurrentBalance(
    state.currentBalance,
    touched.currentBalance || false
  );
  if (currentBalanceValidation.error) errors.currentBalance = currentBalanceValidation.error;

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

  // Validate interest rate
  const interestRateValidation = validateInterestRate(
    state.interestRate,
    touched.interestRate || false
  );
  if (interestRateValidation.error) errors.interestRate = interestRateValidation.error;
  if (interestRateValidation.info) info.interestRate = interestRateValidation.info;

  return {
    errors,
    info,
    hasBlockingErrors: Object.keys(errors).length > 0,
  };
}
