import { getConsoleErrorCode } from '@/services/console'

/**
 * What a refusal means in the reader's language.
 *
 * The console's refusals carry a business code — `invalid_usage_cap`,
 * `already_entitled` — and the server's own `detail` is written for whoever
 * reads the logs. `explain` is asked for the wording a page has for that code,
 * and anything a page has no wording for falls back rather than putting an
 * English sentence from the API in front of a reader.
 */
export function refusalMessage(
  error: unknown,
  fallback: string,
  explain: (code: string) => string | null
): string {
  const code = getConsoleErrorCode(error)

  return (code && explain(code)) || fallback
}
