'use client'

import { useCallback, useState, type ComponentType, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import FormHelperText from '@mui/material/FormHelperText'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

import CustomTextField from '@/components/ui/TextField'
import { useAddressLookup } from '@/hooks/useAddressLookup'
import type { AddressSuggestion, ResolvedAddress } from '@/services/geo'

/**
 * Above the dialog it is typed in.
 *
 * The suggestions used to be drawn by the provider's own SDK, into an element it
 * appended to the body and which had to be lifted over MUI's dialog by hand. The
 * list is ours now, but it is still a portal over the same dialogs, so it still
 * needs to sit above the 1300 they use.
 */
const SUGGESTIONS_ZINDEX = 1400

type AddressLookupFieldProps = {
  value: string
  onChange: (value: string) => void
  /** A suggestion was picked and expanded: fill the rest of the address in. */
  onResolved: (address: ResolvedAddress) => void
  label?: ReactNode
  placeholder?: string
  helperText?: ReactNode
  error?: boolean
  required?: boolean
  name?: string
  fullWidth?: boolean
  /**
   * The text field to render, so the lookup can be added to a form without
   * restyling it: the admin's own field by default, a plain MUI one where that is
   * what the form beside it already uses.
   */
  component?: ComponentType<TextFieldProps>
}

/**
 * An address line that suggests real addresses, and fills in the fields beside it.
 *
 * The suggestions come from our own server, which keeps the provider key off the
 * page and bills the lookup to the workspace that spent it. Everything that makes
 * that work — debouncing, discarding answers to superseded keystrokes, one billing
 * session per address picked — is in `useAddressLookup`; this is the field around it.
 *
 * It degrades to an ordinary text input, silently, whenever the lookup has nothing
 * to offer: switched off for the workspace, unreachable, or out of budget for the
 * month. Only the last of those says anything, because only that one is worth a
 * line to the person typing.
 */
const AddressLookupField = ({
  value,
  onChange,
  onResolved,
  label,
  placeholder,
  helperText,
  error,
  required,
  name,
  fullWidth = true,
  component: TextFieldComponent = CustomTextField
}: AddressLookupFieldProps) => {
  const t = useTranslations('common')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const { suggestions, capped, search, clear, select } = useAddressLookup()

  const handleSelect = useCallback(
    async (suggestion: AddressSuggestion) => {
      setOpen(false)
      setActiveIndex(-1)

      const resolved = await select(suggestion)

      // Capped, or the provider could not answer. What was typed stands: the
      // address is still one a person can finish by hand.
      if (!resolved) return

      onChange(resolved.address_line1 || resolved.formatted_address || value)
      onResolved(resolved)
    },
    [onChange, onResolved, select, value]
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
      setActiveIndex(-1)
      setOpen(true)
      search(event.target.value)
    },
    [onChange, search]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault()
        handleSelect(suggestions[activeIndex])
      } else if (event.key === 'Escape') {
        setOpen(false)
        clear()
      }
    },
    [activeIndex, clear, handleSelect, open, suggestions]
  )

  return (
    <div ref={setAnchorEl} style={{ width: '100%' }}>
      <TextFieldComponent
        name={name}
        label={label}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        // The list closes on the next tick so that a click landing on it is still
        // a click on something that exists.
        onBlur={() => { setTimeout(() => setOpen(false), 200) }}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        required={required}
        fullWidth={fullWidth}
        autoComplete='off'
      />
      {capped && <FormHelperText>{t('addressLookup.usageCapReached')}</FormHelperText>}
      <Popper
        open={open && suggestions.length > 0}
        anchorEl={anchorEl}
        placement='bottom-start'
        style={{ zIndex: SUGGESTIONS_ZINDEX, width: anchorEl?.clientWidth }}
      >
        <Paper elevation={4} sx={{ maxHeight: 240, overflowY: 'auto' }}>
          <MenuList dense disablePadding>
            {suggestions.map((suggestion, index) => (
              <MenuItem
                key={suggestion.place_id}
                selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                // Keeps focus in the field, so neither the blur above nor a dialog's
                // focus trap gets to cancel the click that is already happening.
                onMouseDown={event => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                sx={{ whiteSpace: 'normal' }}
              >
                {suggestion.description || suggestion.main_text}
              </MenuItem>
            ))}
          </MenuList>
          <Typography variant='caption' sx={{ display: 'block', px: 3, pb: 1, textAlign: 'right', opacity: 0.5 }}>
            Powered by Google
          </Typography>
        </Paper>
      </Popper>
    </div>
  )
}

export default AddressLookupField
