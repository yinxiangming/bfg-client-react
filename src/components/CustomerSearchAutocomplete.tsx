'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Customer } from '@/services/store'
import { getCustomers } from '@/services/store'

/** Shared helper for customer display (name, email, phone). Reusable across ResaleCustomerSection, payouts filter, etc. */
export function getCustomerDisplayName(customer: Customer) {
  const firstName = customer.user?.first_name || ''
  const lastName = customer.user?.last_name || ''
  const email = customer.user?.email || customer.user_email || ''
  const phone = customer.user?.phone || ''
  const fullName = `${firstName} ${lastName}`.trim() || email
  return { firstName, lastName, email, phone, fullName }
}

export interface CustomerSearchAutocompleteProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  label?: string
  placeholder?: string
  helperText?: string
  size?: 'small' | 'medium'
  disabled?: boolean
}

const DEBOUNCE_MS = 300

export default function CustomerSearchAutocomplete({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  size = 'small',
  disabled = false
}: CustomerSearchAutocompleteProps) {
  const [options, setOptions] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOptions = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const list = await getCustomers(search.trim() ? { search: search.trim() } : undefined)
      setOptions(list)
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      fetchOptions(inputValue)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, fetchOptions])

  // Sync inputValue when value is set (display selected). When value is cleared, keep user input.
  useEffect(() => {
    if (value) {
      const { fullName, email } = getCustomerDisplayName(value)
      setInputValue(`${fullName} (${email})`.trim() || '')
    }
  }, [value])

  const displayOptions = value && !options.some((o) => o.id === value.id) ? [value, ...options] : options

  const handleInputChange = (_: unknown, v: string) => {
    setInputValue(v)
    if (value) {
      const { fullName, email } = getCustomerDisplayName(value)
      const label = `${fullName} (${email})`.trim() || String(value.id)
      if (v !== label) onChange(null)
    }
  }

  return (
    <Autocomplete
      value={value}
      onChange={(_, c) => onChange(c)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={displayOptions}
      getOptionLabel={(opt) => {
        const { fullName, email } = getCustomerDisplayName(opt)
        return `${fullName} (${email})`.trim() || String(opt.id)
      }}
      filterOptions={(x) => x}
      loading={loading}
      disabled={disabled}
      size={size}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
        />
      )}
      renderOption={(props, opt) => {
        const { fullName, email, phone } = getCustomerDisplayName(opt)
        return (
          <li {...props} key={opt.id}>
            <Box>
              <Typography variant="body1">{fullName || email || '—'}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {email}
                {phone ? ` · ${phone}` : ''}
              </Typography>
            </Box>
          </li>
        )
      }}
    />
  )
}
