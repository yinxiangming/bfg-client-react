/**
 * Internationalization utilities for page builder
 */

type LocalizedText = string | Record<string, string>

/**
 * Get localized text from a value that can be either a string or an object with language keys
 *
 * @param value - String or object with language keys (e.g., { en: "Hello", zh: "你好" })
 * @param locale - Current locale code (e.g., "en", "zh")
 * @param fallbackLocale - Fallback locale if current locale not found (default: "en")
 * @returns The localized string
 *
 * @example
 * // Simple string
 * getLocalizedText("Hello", "en") // "Hello"
 *
 * // Localized object
 * getLocalizedText({ en: "Hello", zh: "你好" }, "zh") // "你好"
 * getLocalizedText({ en: "Hello", zh: "你好" }, "fr") // "Hello" (fallback to en)
 */
export function getLocalizedText(
  value: LocalizedText | undefined | null,
  locale: string,
  fallbackLocale: string = 'en'
): string {
  if (value === undefined || value === null) {
    return ''
  }

  // If it's a simple string, return as-is
  if (typeof value === 'string') {
    return value
  }

  // If it's an object, try to get the localized value
  if (typeof value === 'object') {
    // Try exact locale match
    if (value[locale]) {
      return value[locale]
    }

    // Try fallback locale
    if (value[fallbackLocale]) {
      return value[fallbackLocale]
    }

    // Return first available value
    const keys = Object.keys(value)
    if (keys.length > 0) {
      return value[keys[0]]
    }
  }

  return ''
}

/**
 * Create a localized text object from a string and locale
 *
 * @param text - The text to set
 * @param locale - The locale to set the text for
 * @param existing - Optional existing localized object to merge with
 * @returns A localized text object
 */
export function setLocalizedText(
  text: string,
  locale: string,
  existing?: Record<string, string>
): Record<string, string> {
  return {
    ...(existing || {}),
    [locale]: text,
  }
}

/**
 * Check if a value is a localized text object
 */
export function isLocalizedText(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Get all available locales from a localized text object
 */
export function getAvailableLocales(value: LocalizedText): string[] {
  if (typeof value === 'string') {
    return []
  }
  return Object.keys(value)
}
