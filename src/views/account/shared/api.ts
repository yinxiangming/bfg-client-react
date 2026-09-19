/** The rows of a list response, whether it came back paginated (`{ results }`) or as a bare array. */
export function listOf<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[]

  const results = (response as { results?: unknown } | null | undefined)?.results

  return Array.isArray(results) ? (results as T[]) : []
}
