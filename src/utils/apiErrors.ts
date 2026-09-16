/**
 * Stable error codes the API puts in a refused response's `code`, and the copy the
 * UI shows for them.
 *
 * Same shape as the workspace codes in services/platform.ts — a code maps to a
 * message key, resolved where there is a translator — with one addition: the copy is
 * also left in the registry at the bottom of this file, so the API clients can put it
 * straight into the thrown error's `message`. Almost every caller shows a failure as
 * `err.message`, and a code that has a sentence of its own is worth more there than
 * in the handful of places that would otherwise ask for it by name.
 */

/**
 * A write refused because the workspace may currently only be read. HTTP 403.
 * Reads, exports, and the few writes the server still allows are unaffected, so this
 * is about the one request rather than about the session.
 */
export const WORKSPACE_READ_ONLY_CODE = 'workspace_read_only'

/** Message key in the `common` namespace for each code the UI explains in its own words. */
export const API_ERROR_MESSAGE_KEYS: Record<string, string> = {
  [WORKSPACE_READ_ONLY_CODE]: 'apiErrors.workspaceReadOnly',
}

/**
 * The `code` a failed request carried, or null when it carried none.
 *
 * The two API clients keep the parsed response body under different names —
 * `validationErrors` and `data` — so look under both.
 */
export function getApiErrorCode(error: unknown): string | null {
  const candidate = error as { validationErrors?: unknown; data?: unknown } | null
  const body = (candidate?.validationErrors ?? candidate?.data) as { code?: unknown } | null | undefined

  return typeof body?.code === 'string' ? body.code : null
}

/**
 * True only for the read-only refusal: HTTP 403 carrying that code.
 *
 * Deliberately narrow, so it never catches the other 403s — a missing permission, a
 * token that has expired — each of which needs its own handling.
 */
export function isWorkspaceReadOnlyError(error: unknown): boolean {
  if ((error as { status?: number } | null)?.status !== 403) return false

  return getApiErrorCode(error) === WORKSPACE_READ_ONLY_CODE
}

/**
 * Translated copy for the codes above, left here by <ApiErrorMessages /> for the API
 * clients to read. Resolving a message key needs the message bundle, which only a
 * component can reach; the clients are plain functions.
 *
 * Browser only, by design. Module state on the server is shared by every request it
 * serves, so a locale left over from one visitor's page would reach the next one's.
 * On the server this stays empty and the server's own wording is used — which is
 * already written for a reader, just not in their language.
 */
let messages: Record<string, string> = {}

export function setApiErrorMessages(next: Record<string, string>): void {
  if (typeof window === 'undefined') return
  messages = next
}

/** Our sentence for a code, or null when the server's own wording is all we have. */
export function getApiErrorMessage(code: unknown): string | null {
  if (typeof code !== 'string') return null

  return messages[code] ?? null
}
