// Debt payoff math helpers. Keep everything in full floating-point precision
// and only round/format at display time.

export type CompoundingFrequency =
  | "daily"
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "quarterly"
  | "semi-annually"
  | "annually";

export interface PayoffResult {
  timeInMonths: number;
  totalInterest: number;
  totalAmountPaid: number;
  interestSaved: number;
  payoffDate: Date;
}

export interface RequiredPaymentResult {
  requiredPayment: number;
  totalInterest: number;
  totalAmountPaid: number;
}

export function getCompoundingPeriodsPerYear(
  frequency: CompoundingFrequency,
): number {
  switch (frequency) {
    case "daily":
      return 365;
    case "weekly":
      return 52;
    case "bi-weekly":
      return 26;
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "semi-annually":
      return 2;
    case "annually":
      return 1;
  }
}

export function getPeriodLabel(frequency: CompoundingFrequency): string {
  switch (frequency) {
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "bi-weekly":
      return "bi-weekly period";
    case "monthly":
      return "month";
    case "quarterly":
      return "quarter";
    case "semi-annually":
      return "semi-annual period";
    case "annually":
      return "year";
  }
}

/**
 * Amortization periods/totals for a fixed payment. Handles the zero-rate case
 * separately since the standard log-based formula divides by log(1) = 0 there.
 */
export function amortize(
  principal: number,
  periodicRate: number,
  totalPayment: number,
): { numPeriods: number; totalAmountPaid: number; totalInterest: number } {
  if (periodicRate === 0) {
    const numPeriods = totalPayment > 0 ? principal / totalPayment : 0;
    return { numPeriods, totalAmountPaid: principal, totalInterest: 0 };
  }
  const numPeriods =
    -Math.log(1 - (principal * periodicRate) / totalPayment) /
    Math.log(1 + periodicRate);
  const totalAmountPaid = totalPayment * numPeriods;
  const totalInterest = totalAmountPaid - principal;
  return { numPeriods, totalAmountPaid, totalInterest };
}

export function calculatePayoffTime(params: {
  principal: number;
  periodicRate: number;
  periodsPerYear: number;
  payment: number;
  additionalPayment: number;
  totalPayment: number;
  paymentTooLow: boolean;
}): PayoffResult {
  const {
    principal,
    periodicRate,
    periodsPerYear,
    payment,
    additionalPayment,
    totalPayment,
    paymentTooLow,
  } = params;

  if (paymentTooLow) {
    return {
      timeInMonths: NaN,
      totalInterest: NaN,
      totalAmountPaid: NaN,
      interestSaved: 0,
      payoffDate: new Date(),
    };
  }

  const { numPeriods, totalAmountPaid, totalInterest } = amortize(
    principal,
    periodicRate,
    totalPayment,
  );
  const timeInMonths = (numPeriods / periodsPerYear) * 12;

  // Interest saved by the additional payment, if any.
  let interestSaved = 0;
  if (additionalPayment > 0 && payment > principal * periodicRate) {
    const base = amortize(principal, periodicRate, payment);
    interestSaved = base.totalInterest - totalInterest;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(timeInMonths));

  return {
    timeInMonths: Math.ceil(timeInMonths),
    totalInterest,
    totalAmountPaid,
    interestSaved,
    payoffDate,
  };
}

export function calculateRequiredPayment(params: {
  principal: number;
  periodicRate: number;
  periodsPerYear: number;
  totalTargetMonths: number;
}): RequiredPaymentResult {
  const { principal, periodicRate, periodsPerYear, totalTargetMonths } = params;
  const numPeriods = (totalTargetMonths / 12) * periodsPerYear;

  let requiredPayment: number;
  if (numPeriods <= 0) {
    requiredPayment = 0;
  } else if (periodicRate === 0) {
    requiredPayment = principal / numPeriods;
  } else {
    requiredPayment =
      (principal * periodicRate * Math.pow(1 + periodicRate, numPeriods)) /
      (Math.pow(1 + periodicRate, numPeriods) - 1);
  }

  const totalAmountPaid = requiredPayment * numPeriods;
  const totalInterest = totalAmountPaid - principal;

  return {
    requiredPayment,
    totalInterest,
    totalAmountPaid,
  };
}

export function formatCurrency(amount: number): string {
  if (!isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatTime(months: number): string {
  if (!isFinite(months)) return "—";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0)
    return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
}
