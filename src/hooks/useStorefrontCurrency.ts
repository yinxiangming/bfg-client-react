'use client'

import { useCallback, useMemo } from 'react'

import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { formatCurrency, normalizeCurrencyCode } from '@/utils/format'

type StorefrontCurrency = {
  /** ISO 4217 code for the current workspace, e.g. `NZD`. Safe to print as a label. */
  currency: string
  /** Format an amount in the workspace's currency, e.g. `NZ$1,234.50`. */
  formatPrice: (value: number | string) => string
}

/**
 * Currency for the storefront being served, taken from the workspace's
 * `default_currency` setting rather than a hardcoded symbol or translation
 * string.
 *
 * One deployment serves many workspaces, so a fixed "USD"/"$" is wrong for
 * every shop that doesn't charge in dollars — and on a storefront that quotes
 * NZD while labelling the total USD, it misstates the price to the buyer.
 */
export function useStorefrontCurrency(): StorefrontCurrency {
  const config = useStorefrontConfigSafe()
  const currency = useMemo(() => normalizeCurrencyCode(config.default_currency), [config.default_currency])
  const formatPrice = useCallback((value: number | string) => formatCurrency(value, currency), [currency])

  return { currency, formatPrice }
}
