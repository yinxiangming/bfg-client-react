'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import CustomTextField from '@/components/ui/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'

export interface FilterDateRangeValue {
  start?: string
  end?: string
}

type FilterDateRangePickerProps = {
  value: FilterDateRangeValue
  onChange: (value: FilterDateRangeValue) => void
  /** Show switch to toggle date-only vs date+time */
  includeTimeSwitch?: boolean
  /** Default for time switch (uncontrolled) or initial when controlled */
  defaultTimeEnabled?: boolean
  /** Controlled: include time on (persisted by parent so state is remembered when dialog reopens) */
  includeTime?: boolean
  onIncludeTimeChange?: (enabled: boolean) => void
  onApply?: () => void
  onCancel?: () => void
  /** When true, show Apply/Cancel buttons (e.g. inside popover) */
  showActions?: boolean
}

/** Normalize to date-only (YYYY-MM-DD) for APIs that only accept date */
export function toDateOnly(isoOrDate: string): string {
  if (!isoOrDate) return ''
  const i = isoOrDate.indexOf('T')
  return i >= 0 ? isoOrDate.slice(0, i) : isoOrDate
}

export default function FilterDateRangePicker({
  value,
  onChange,
  includeTimeSwitch = false,
  defaultTimeEnabled = false,
  includeTime: controlledIncludeTime,
  onIncludeTimeChange,
  onApply,
  onCancel,
  showActions = false
}: FilterDateRangePickerProps) {
  const t = useTranslations('admin')
  const [includeTimeUncontrolled, setIncludeTimeUncontrolled] = useState(defaultTimeEnabled)
  const isIncludeTimeControlled = controlledIncludeTime !== undefined && onIncludeTimeChange != null
  const includeTime = isIncludeTimeControlled ? controlledIncludeTime : includeTimeUncontrolled
  const setIncludeTime = (v: boolean) => {
    if (isIncludeTimeControlled) onIncludeTimeChange?.(v)
    else setIncludeTimeUncontrolled(v)
  }

  // Normalize value for display: date-only <-> datetime so inputs show correctly when reopening
  const toDisplayStart = (v: string | undefined): string => {
    if (!v) return ''
    if (includeTime) return v.includes('T') ? v : v + 'T00:00'
    return v.includes('T') ? v.slice(0, v.indexOf('T')) : v
  }
  const toDisplayEnd = (v: string | undefined): string => {
    if (!v) return ''
    if (includeTime) return v.includes('T') ? v : v + 'T23:59'
    return v.includes('T') ? v.slice(0, v.indexOf('T')) : v
  }

  const [start, setStart] = useState(() => toDisplayStart(value.start))
  const [end, setEnd] = useState(() => toDisplayEnd(value.end))

  useEffect(() => {
    setStart(toDisplayStart(value.start))
    setEnd(toDisplayEnd(value.end))
  }, [value.start, value.end, includeTime])

  const inputType = includeTime ? 'datetime-local' : 'date'
  const handleStartChange = (v: string) => {
    setStart(v)
    onChange({ start: v || undefined, end: end || undefined })
  }
  const handleEndChange = (v: string) => {
    setEnd(v)
    onChange({ start: start || undefined, end: v || undefined })
  }

  return (
    <Box sx={{ p: 2, minWidth: 280 }}>
      {includeTimeSwitch && (
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={includeTime}
              onChange={(e) => setIncludeTime(e.target.checked)}
            />
          }
          label={t('common.schemaTable.dateRange.includeTime')}
          sx={{ mb: 1.5, display: 'block' }}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <CustomTextField
          type={inputType}
          size="small"
          label={t('common.schemaTable.dateRange.start')}
          value={start}
          onChange={(e) => handleStartChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <CustomTextField
          type={inputType}
          size="small"
          label={t('common.schemaTable.dateRange.end')}
          value={end}
          onChange={(e) => handleEndChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>
      {showActions && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
          {onCancel && (
            <Button size="small" onClick={onCancel}>
              {t('common.schemaTable.dateRange.cancel')}
            </Button>
          )}
          {onApply && (
            <Button size="small" variant="contained" onClick={onApply}>
              {t('common.schemaTable.dateRange.apply')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
