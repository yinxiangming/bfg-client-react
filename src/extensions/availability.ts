/**
 * Which extensions a workspace has switched on, as reported by the API: `extensions` on
 * `/api/v1/me/` for the admin, and on the storefront config for the storefront and account.
 *
 * `offered` lists the extensions the server manages; `available` the ones live for this
 * workspace. A plugin the server does not manage is always enabled, and so is every plugin
 * when the server reports nothing, so a deployment without server-side extension records
 * behaves as before.
 */
export type ExtensionAvailability = {
  available: string[]
  offered: string[]
}

function isAvailability(value: unknown): value is ExtensionAvailability {
  const candidate = value as ExtensionAvailability | null | undefined
  return Array.isArray(candidate?.available) && Array.isArray(candidate?.offered)
}

export function isExtensionEnabled(id: string, availability?: ExtensionAvailability | null): boolean {
  if (!isAvailability(availability)) return true
  if (!availability.offered.includes(id)) return true
  return availability.available.includes(id)
}

export function filterEnabledExtensions<T extends { id: string }>(
  extensions: T[],
  availability?: ExtensionAvailability | null
): T[] {
  return extensions.filter((extension) => isExtensionEnabled(extension.id, availability))
}
