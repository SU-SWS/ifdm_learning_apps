// Retirement math helpers, plus the shared types and formatters they're used
// alongside. Rates are decimals (5% -> 0.05) unless otherwise noted; only
// round at display time.

export interface CalculatorInputs {
  annualSpending: number
  retirementLength: number
  expectedReturnDuringRetirement: number
  expectedReturnBeforeRetirement: number
  currentSavings: number
  yearsToRetirement: number
}

export const defaultInputs: CalculatorInputs = {
  annualSpending: 0,
  retirementLength: 0,
  expectedReturnDuringRetirement: 0,
  expectedReturnBeforeRetirement: 0,
  currentSavings: 0,
  yearsToRetirement: 0,
}

export interface RetirementResults {
  requiredBalance: number
  targetBalance: number
  annualSavings: number
  monthlySavings: number
  biWeeklySavings: number
  weeklySavings: number
  fvCurrentSavings: number
}

/**
 * Present value of `retirementLength` years of level annual withdrawals of
 * `annualSpending`, discounted at `rate`. This is the lump sum required at
 * the start of retirement to fund that spending.
 */
export function calculateRequiredBalance(annualSpending: number, retirementLength: number, rate: number): number {
  if (rate === 0) {
    return annualSpending * retirementLength
  }
  return annualSpending * ((1 - Math.pow(1 + rate, -retirementLength)) / rate)
}

/** Future value of a single present amount, compounded annually at `rate` for `years`. */
export function futureValue(presentValue: number, rate: number, years: number): number {
  return presentValue * Math.pow(1 + rate, years)
}

/**
 * Level savings contribution, made `frequency` times per year over `years`,
 * that grows to `targetBalance` at `rate`. `frequency: 1` gives the annual
 * savings amount; 12/26/52 give monthly/bi-weekly/weekly equivalents.
 */
export function calculatePeriodicSavings(targetBalance: number, rate: number, years: number, frequency: number): number {
  if (years <= 0) return 0
  if (rate === 0) {
    return targetBalance / (years * frequency)
  }
  const periodRate = rate / frequency
  const totalPeriods = years * frequency
  return targetBalance * (periodRate / (Math.pow(1 + periodRate, totalPeriods) - 1))
}

/** Full results panel for the "Annual savings" tab. */
export function calculateSavingsResults(
  requiredBalance: number,
  currentSavings: number,
  yearsToRetirement: number,
  returnBeforeRetirement: number
): RetirementResults {
  const fvCurrentSavings = futureValue(currentSavings, returnBeforeRetirement, yearsToRetirement)
  const targetBalance = Math.max(0, requiredBalance - fvCurrentSavings)

  return {
    requiredBalance: Math.round(requiredBalance),
    targetBalance: Math.round(targetBalance),
    annualSavings: Math.round(calculatePeriodicSavings(targetBalance, returnBeforeRetirement, yearsToRetirement, 1)),
    monthlySavings: Math.round(calculatePeriodicSavings(targetBalance, returnBeforeRetirement, yearsToRetirement, 12)),
    biWeeklySavings: Math.round(calculatePeriodicSavings(targetBalance, returnBeforeRetirement, yearsToRetirement, 26)),
    weeklySavings: Math.round(calculatePeriodicSavings(targetBalance, returnBeforeRetirement, yearsToRetirement, 52)),
    fvCurrentSavings: Math.round(fvCurrentSavings),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumberWithCommas(value: string): string {
  const num = value.replace(/,/g, "")
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
