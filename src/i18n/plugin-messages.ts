import type { AppLocale } from './routing'

export type PluginMessages = Record<string, unknown>

/**
 * Load optional plugin i18n messages (e.g. resale).
 * Override this in your app when you have plugins that provide messages.
 * Return shape: { account?, admin?, resale? } for deep-merge with app messages.
 */
export async function loadPluginMessages(
  _locale: AppLocale
): Promise<PluginMessages | null> {
  return null
}
