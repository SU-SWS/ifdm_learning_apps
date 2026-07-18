// Mortgage math helpers. Keep everything in full floating-point precision and
// only round at display time.

/** Convert an annual percentage rate to a monthly decimal rate. */
export function monthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12
}

/**
 * Present value of a stream of `n` level monthly payments of `pmt`, discounted
 * at monthly rate `r`. This is also the outstanding balance of a loan with `n`
 * payments remaining.
 */
export function presentValueOfPayments(pmt: number, r: number, n: number): number {
  if (n <= 0) return 0
  if (r === 0) return pmt * n
  return pmt * ((1 - Math.pow(1 + r, -n)) / r)
}

/** Level monthly payment that fully amortizes `loan` over `n` months at rate `r`. */
export function paymentFromLoan(loan: number, r: number, n: number): number {
  if (n <= 0) return 0
  if (r === 0) return loan / n
  return (loan * r) / (1 - Math.pow(1 + r, -n))
}

/** Discount a single future amount back to today over `n` months at rate `r`. */
export function discountFactor(r: number, n: number): number {
  return Math.pow(1 + r, -n)
}

/** Format a number as USD currency with two decimals. */
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
