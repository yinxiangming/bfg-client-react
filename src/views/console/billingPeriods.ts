/**
 * The months and days the usage and bills pages are written in.
 *
 * Both APIs date things as plain calendar strings — `2026-09` for a month, `2026-09-01`
 * for a day — which carry no time of day and no zone. Read as a `Date` and printed in
 * the reader's own zone they slip: `new Date('2026-09-01')` is midnight UTC, which is
 * still 31 August anywhere west of Greenwich. So every one of them is built and printed
 * in UTC, and the reader sees the day the server meant.
 */

import { getIntlLocale } from '@/utils/format'

/** `YYYY-MM`, the shape the usage API takes and the invoices carry. */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

/** The month a `YYYY-MM` or `YYYY-MM-DD` names, as a UTC date, or null when it is neither. */
function toUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null

  const parts = value.split('-').map(Number)
  const [year, month, day = 1] = parts

  if (parts.length < 2 || parts.some(part => !Number.isInteger(part))) return null

  const date = new Date(Date.UTC(year, month - 1, day))

  return isNaN(date.getTime()) ? null : date
}

/** `2026-09` as the reader's language writes a month: September 2026, or 2026年9月. */
export function formatPeriod(period: string | null | undefined, locale: string): string {
  const date = toUtcDate(period)

  if (!date) return period || ''

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(date)
}

/**
 * `2026-09-01` as a short date.
 *
 * A date the API leaves empty prints as nothing: an invoice can be issued with no
 * due date, and a cell that says nothing is the honest rendering of that.
 */
export function formatDay(day: string | null | undefined, locale: string): string {
  const date = toUtcDate(day)

  if (!date) return day || ''

  return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

/**
 * A timestamp as a date and a time in the reader's own zone.
 *
 * The opposite case to the two above, and the reason both of them exist: a
 * timestamp is a moment, it arrives carrying its offset, and the reader wants it
 * where they are — "changed at 9am" means their 9am. A calendar date is not a
 * moment and must not be read as one, which is what `formatDay` is for.
 */
export function formatMoment(value: string | null | undefined, locale: string): string {
  if (!value) return ''

  const moment = new Date(value)

  if (isNaN(moment.getTime())) return value

  return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(moment)
}

/**
 * A timestamp as a date in the reader's own zone, with no time of day.
 *
 * For a moment whose *day* is the whole of what the reader can act on — when a period
 * runs out, when a trial ends. Printing the minute as well makes a sentence about next
 * month read like an appointment.
 */
export function formatMomentDay(value: string | null | undefined, locale: string): string {
  if (!value) return ''

  const moment = new Date(value)

  if (isNaN(moment.getTime())) return value

  return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium' }).format(moment)
}

/** This month as `YYYY-MM`, by the reader's clock — which is what they mean by "this month". */
export function currentMonth(): string {
  const now = new Date()

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** This month and the `count - 1` before it, newest first. */
export function recentMonths(count: number): string[] {
  const now = new Date()
  const months: string[] = []

  for (let back = 0; back < count; back++) {
    const month = new Date(Date.UTC(now.getFullYear(), now.getMonth() - back, 1))

    months.push(`${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`)
  }

  return months
}
