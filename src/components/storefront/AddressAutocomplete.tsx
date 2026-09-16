'use client'

import { useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { useAddressLookup } from '@/hooks/useAddressLookup'
import type { AddressSuggestion } from '@/services/geo'

type AddressComponents = {
  address: string
  city: string
  state: string
  zip: string
  country: string
}

type AddressAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (components: AddressComponents) => void
  placeholder?: string
  required?: boolean
  style?: React.CSSProperties
}

/**
 * The address field on the storefront, suggesting real addresses as they are typed.
 *
 * The suggestions come from our own server rather than from a provider SDK loaded
 * into the page: the key stays on the server, and the shop that spent a lookup is
 * the shop billed for it. Nothing here needs the provider to be reachable from the
 * browser, and nothing here breaks when it is not — an address that gets no
 * suggestions is still an address someone can type.
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  required = false,
  style
}: AddressAutocompleteProps) => {
  const t = useTranslations('storefront')
  const tCommon = useTranslations('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const onChangeRef = useRef(onChange)
  const onAddressSelectRef = useRef(onAddressSelect)
  const selectingRef = useRef(false)
  const { suggestions, capped, search, clear, select } = useAddressLookup()

  onChangeRef.current = onChange
  onAddressSelectRef.current = onAddressSelect

  const handleSelect = useCallback(
    async (suggestion: AddressSuggestion) => {
      selectingRef.current = true
      setShowDropdown(false)

      try {
        const resolved = await select(suggestion)

        // Capped, or the provider could not answer. What was typed stands, and the
        // rest of the form is the shopper's to fill in as it always was.
        if (!resolved) return

        const components: AddressComponents = {
          address: resolved.address_line1,
          city: resolved.city,
          state: resolved.state,
          zip: resolved.postal_code,
          country: resolved.country
        }

        onChangeRef.current(components.address || resolved.formatted_address || '')
        onAddressSelectRef.current(components)
      } finally {
        selectingRef.current = false
      }
    },
    [select]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value

      onChange(val)
      setActiveIndex(-1)
      setShowDropdown(true)
      search(val)
    },
    [onChange, search]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[activeIndex])
      } else if (e.key === 'Escape') {
        setShowDropdown(false)
        clear()
      }
    },
    [showDropdown, suggestions, activeIndex, handleSelect, clear]
  )

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!selectingRef.current) setShowDropdown(false)
    }, 200)
  }, [])

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'var(--mui-palette-background-paper, #fff)',
    border: '1px solid var(--mui-palette-divider, #d0d0d0)',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: 240,
    overflowY: 'auto',
    marginTop: -1,
  }

  const itemStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    background: active ? 'var(--mui-palette-action-hover, #f5f5f5)' : 'transparent',
    borderBottom: '1px solid var(--mui-palette-divider, #eee)',
    transition: 'background 0.15s',
  })

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
        onBlur={handleBlur}
        placeholder={placeholder || t('checkout.delivery.address')}
        required={required}
        style={{ ...defaultStyle, ...style }}
        autoComplete='off'
      />
      {capped && (
        <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--mui-palette-text-secondary, #666)' }}>
          {tCommon('addressLookup.usageCapReached')}
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div style={dropdownStyle}>
          {suggestions.map((s, i) => (
            <div
              key={s.place_id || i}
              style={itemStyle(i === activeIndex)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(s)
              }}
            >
              {s.description || s.main_text}
            </div>
          ))}
          <div style={{ padding: '4px 14px 6px', fontSize: '0.7rem', opacity: 0.5, textAlign: 'right' }}>
            Powered by Google
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete
