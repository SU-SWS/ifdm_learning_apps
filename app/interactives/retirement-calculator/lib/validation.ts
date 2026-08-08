// Per-field validation rules for the retirement calculator inputs.

export interface FieldValidation {
  error?: string;
  warning?: string;
}

export function validateAnnualSpending(numValue: number): FieldValidation {
  const error =
    numValue !== 0 && (numValue < 1 || numValue > 10_000_000)
      ? "Enter an amount between $1 and $10,000,000."
      : undefined;
  return { error };
}

export function validateCurrentSavings(numValue: number): FieldValidation {
  const error =
    numValue < 0 || numValue > 100_000_000
      ? "Enter an amount between $0 and $100,000,000."
      : undefined;
  return { error };
}

export function validateReturnBeforeRetirement(
  numValue: number,
): FieldValidation {
  if (numValue < -5 || numValue > 30) {
    return { error: "Enter a rate between −5% and 30%.", warning: undefined };
  }
  if (numValue >= -5 && numValue < 0) {
    return {
      error: undefined,
      warning:
        "A negative return means your savings are expected to lose value over time. Double-check your entry.",
    };
  }
  return { error: undefined, warning: undefined };
}

export function validateReturnDuringRetirement(
  numValue: number,
): FieldValidation {
  const error =
    numValue !== 0 && (numValue < -5 || numValue > 30)
      ? "Enter a rate between −5% and 30%."
      : undefined;
  const warning =
    numValue >= -5 && numValue < 0
      ? "A negative return means your savings are expected to lose value over time. Double-check your entry."
      : undefined;
  return { error, warning };
}

export function validateRetirementLength(numValue: number): FieldValidation {
  const error =
    numValue !== 0 && (numValue < 1 || numValue > 75)
      ? "Enter an amount of years between 1 and 75."
      : undefined;
  const warning =
    numValue >= 1 && numValue <= 3
      ? "This is a very short retirement. Double-check your entry."
      : undefined;
  return { error, warning };
}

export function validateYearsToRetirement(
  numValue: number,
  rawValue: string,
): FieldValidation | undefined {
  if (numValue < 0 || numValue > 75) {
    return { error: "Enter an amount of years between 0 and 75." };
  }
  if (numValue === 0 && rawValue !== "") {
    return {
      error:
        "With no time left to save, you'd need your full target balance today.",
    };
  }
  if (numValue > 0) {
    return { error: undefined };
  }
  return undefined;
}
