// Validation rules for the Mortgage Refinancing Calculator (IFDM-171).
//
// Every state defined by the ticket is an *error* state — there are no warning
// states here, because the ticket marks 0% and 20% as valid endpoints rather
// than unusual values. An errored field blocks the calculation and the result
// panel shows an em dash instead of a number.
//
// This module is pure: it takes the raw input strings plus the UI's
// touched/focus/analyzed state and returns the messages to render and the
// flags that gate the output. Keeping it separate from the component means the
// calc and the render read from one source of truth and can never disagree.

export const CONSTRAINTS = {
  months: { min: 1, max: 360 },
  currentRate: { min: 0, max: 20 },
  monthlyPayment: { min: 1, max: 1_000_000 },
  newAmount: { min: 1, max: 1_000_000_000 },
  newTerm: { min: 1, max: 360 },
  newRate: { min: 0, max: 20 },
  closingCosts: { min: 0, max: 10_000_000 },
  years: { min: 0, max: 30 },
} as const

export type FieldName = keyof typeof CONSTRAINTS

/** Fields on the Current Balance tab. All three are required. */
export const CURRENT_FIELDS = ['months', 'currentRate', 'monthlyPayment'] as const

/** Required fields on the Refinance Analysis tab. */
export const REFI_REQUIRED_FIELDS = ['newAmount', 'newTerm', 'newRate'] as const

/**
 * Optional fields. Leaving these blank is fine, but a value outside the
 * allowed range still blocks the calculation.
 */
export const REFI_OPTIONAL_FIELDS = ['closingCosts', 'years'] as const

const REQUIRED: ReadonlySet<FieldName> = new Set<FieldName>([
  ...CURRENT_FIELDS,
  ...REFI_REQUIRED_FIELDS,
])

const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/**
 * Required-field copy, verbatim from IFDM-171. Note the ticket omits the
 * trailing period on these while including it on the range messages; the
 * inconsistency is reproduced deliberately rather than normalized.
 */
const EMPTY_MESSAGES: Record<FieldName, string> = {
  months: 'Please enter the number of months remaining on your mortgage',
  currentRate: 'Please enter the current interest rate on your mortgage',
  monthlyPayment: 'Please enter your current monthly payment for your mortgage',
  newAmount: 'Please enter the new loan amount',
  newTerm: 'Please enter the new loan term',
  newRate: 'Please enter the new interest rate',
  closingCosts: '',
  years: '',
}

/**
 * Range copy, verbatim from IFDM-171 but interpolated from CONSTRAINTS so that
 * changing a bound updates the message too.
 */
const RANGE_MESSAGES: Record<FieldName, string> = {
  months: `Enter a number of months between ${CONSTRAINTS.months.min} and ${CONSTRAINTS.months.max}.`,
  currentRate: `Enter a rate between ${CONSTRAINTS.currentRate.min}% and ${CONSTRAINTS.currentRate.max}%.`,
  monthlyPayment: `Enter an amount between ${usd(CONSTRAINTS.monthlyPayment.min)} and ${usd(CONSTRAINTS.monthlyPayment.max)}.`,
  newAmount: `Please enter an amount between ${usd(CONSTRAINTS.newAmount.min)} and ${usd(CONSTRAINTS.newAmount.max)}.`,
  newTerm: `Enter a number of months between ${CONSTRAINTS.newTerm.min} and ${CONSTRAINTS.newTerm.max}.`,
  newRate: `Enter a rate between ${CONSTRAINTS.newRate.min}% and ${CONSTRAINTS.newRate.max}%.`,
  closingCosts: `Enter an amount between ${usd(CONSTRAINTS.closingCosts.min)} and ${usd(CONSTRAINTS.closingCosts.max)}.`,
  years: `Enter a number of years between ${CONSTRAINTS.years.min} and ${CONSTRAINTS.years.max}.`,
}

export type Values = Record<FieldName, string>

export type UiState = {
  /** Fields the user has entered and left at least once. */
  touched: Record<FieldName, boolean>
  /** The field currently being edited, or null. */
  focusedField: string | null
  /** Whether "Calculate results" has been pressed. */
  analyzed: boolean
}

export type Validation = {
  /** Message to render under each field ('' when there is nothing to show). */
  messages: Record<FieldName, string>
  /**
   * Whether a field's value is unusable — empty-but-required, or out of range.
   * True even when the message is still hidden, so the output stays suppressed
   * without prematurely shouting at the user.
   */
  bad: Record<FieldName, boolean>
  /** Any Current Balance field unusable — blocks the balance and the analysis. */
  currentBlocking: boolean
  /** Anything unusable on either tab — blocks the refinance analysis. */
  refiBlocking: boolean
}

/**
 * Decide whether a required field's "Please enter…" message may be shown.
 *
 * Current Balance has no submit button, so its messages wait until the user has
 * left the field (global rules §6). Refinance Analysis messages additionally
 * unlock on "Calculate results", which is the trigger the ticket describes.
 * In both cases the message hides while the field is focused so it does not pop
 * up mid-edit, e.g. while backspacing to clear.
 */
function mayShowEmptyMessage(field: FieldName, ui: UiState): boolean {
  if (ui.focusedField === field) return false
  if (ui.touched[field]) return true
  return ui.analyzed && (REFI_REQUIRED_FIELDS as readonly FieldName[]).includes(field)
}

export function validate(values: Values, ui: UiState): Validation {
  const messages = {} as Record<FieldName, string>
  const bad = {} as Record<FieldName, boolean>

  for (const field of Object.keys(CONSTRAINTS) as FieldName[]) {
    const raw = values[field].replace(/,/g, '').trim()
    const { min, max } = CONSTRAINTS[field]

    if (raw === '') {
      // Empty is only a problem for required fields, and the range message
      // must never fire on a blank field.
      const required = REQUIRED.has(field)
      bad[field] = required
      messages[field] =
        required && mayShowEmptyMessage(field, ui) ? EMPTY_MESSAGES[field] : ''
      continue
    }

    // A bare "." survives the input formatter, so treat anything unparseable
    // the same as out of range rather than letting num() coerce it to 0.
    const n = Number.parseFloat(raw)
    const outOfRange = !Number.isFinite(n) || n < min || n > max
    bad[field] = outOfRange
    // Range messages are never hidden while focused: the user needs to know
    // why the result stopped updating.
    messages[field] = outOfRange ? RANGE_MESSAGES[field] : ''
  }

  const currentBlocking = CURRENT_FIELDS.some((f) => bad[f])
  const refiBlocking =
    currentBlocking ||
    REFI_REQUIRED_FIELDS.some((f) => bad[f]) ||
    REFI_OPTIONAL_FIELDS.some((f) => bad[f])

  return { messages, bad, currentBlocking, refiBlocking }
}
