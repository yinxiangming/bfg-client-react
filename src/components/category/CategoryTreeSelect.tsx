'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
// Label-above field, matching every other control in the admin toolbars. The
// stock MUI TextField's notched label made this filter ~6px taller than the
// selects beside it.
import TextField from '@/components/ui/TextField'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'

// Type Imports
import type { Category } from '@/services/store'

type CategoryTreeSelectProps = {
  categories: Category[]
  value: Category[] | Category | null
  onChange: (categories: Category[]) => void
  onOpen?: () => void
  label?: string
  placeholder?: string
  loading?: boolean
  multiple?: boolean
  /** Styles the field. The mobile entry form scales its controls up for thumb use. */
  sx?: SxProps<Theme>
  /** Styles the popup. Options render in a Popper, outside `sx`'s reach. */
  optionSx?: SxProps<Theme>
}

/**
 * Flatten a category tree into Autocomplete options, depth-first, so a child always
 * follows its parent. `level` drives the indent that is the only thing telling the
 * reader which of them is which.
 *
 * It used to be derived from the path — `parentPath.split(' > ').length` — which
 * answers 1 for a root (`''.split()` yields `['']`) *and* 1 for its children (a
 * single-segment parent path). So the whole first two levels rendered flush left, and
 * a filter dropdown listing "新鲜蔬菜, 葱姜蒜椒, 时令水果, 莓果蓝莓…" read as a flat
 * list of unrelated categories that matched nothing on the categories page — which
 * shows roots only, collapsed behind a chevron. Same rows, same endpoint; only the
 * indent was missing. Depth is passed down explicitly now.
 */
function flattenCategories(
  categories: Category[],
  parentPath: string = '',
  level: number = 0
): Array<Category & { displayLabel: string; level: number }> {
  const result: Array<Category & { displayLabel: string; level: number }> = []
  
  if (!categories || !Array.isArray(categories)) {
    return result
  }
  
  categories.forEach(category => {
    if (!category || !category.name) {
      return // Skip invalid categories
    }
    
    const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name
    result.push({
      ...category,
      displayLabel: currentPath,
      level
    })
    
    // Recursively add children
    if (category.children && Array.isArray(category.children) && category.children.length > 0) {
      result.push(...flattenCategories(category.children, currentPath, level + 1))
    }
  })
  
  return result
}

export default function CategoryTreeSelect({
  categories,
  value,
  onChange,
  onOpen,
  label,
  placeholder = 'Select categories',
  loading = false,
  multiple = true,
  sx,
  optionSx
}: CategoryTreeSelectProps) {
  // Flatten tree structure for Autocomplete
  const flatCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return []
    }
    return flattenCategories(categories)
  }, [categories])

  // Normalize value for Autocomplete
  const normalizedValue = useMemo(() => {
    if (!value) return multiple ? [] : null
    if (Array.isArray(value)) {
      // For single select mode, take the first element if array is provided
      if (!multiple && value.length > 0) {
        const firstValue = value[0]
        if (!firstValue || !firstValue.id) return null
        const flat = flatCategories.find(opt => opt.id === firstValue.id)
        return flat || { ...firstValue, displayLabel: firstValue.name, level: 0 }
      }
      // For multiple select mode, process all values
      return value.filter(Boolean).map(cat => {
        if (!cat || !cat.id) return null
        const flat = flatCategories.find(opt => opt.id === cat.id)
        return flat || { ...cat, displayLabel: cat.name, level: 0 }
      }).filter(Boolean) as Array<Category & { displayLabel: string; level: number }>
    }
    // Single value
    if (!value.id) return multiple ? [] : null
    const flat = flatCategories.find(opt => opt.id === value.id)
    return flat || { ...value, displayLabel: value.name, level: 0 }
  }, [value, flatCategories, multiple])


  return (
    <Autocomplete
      // Autocomplete defaults to medium and passes that down through
      // renderInput's params, which overrode CustomTextField's small default —
      // this control rendered 47px tall next to the 38px selects beside it.
      size='small'
      sx={sx}
      slotProps={optionSx ? { paper: { sx: optionSx } } : undefined}
      multiple={multiple}
      options={flatCategories}
      getOptionLabel={(option) => option.displayLabel || option.name || ''}
      value={normalizedValue}
      onOpen={onOpen}
      onChange={(_, newValue) => {
        // Convert back to Category[] (remove displayLabel and level)
        if (!newValue) {
          onChange([])
          return
        }

        type CategoryOption = Category & { displayLabel: string; level: number }
        const strip = (item: CategoryOption): Category => {
          const { displayLabel, level, ...category } = item
          return category
        }

        if (multiple) {
          const selected = Array.isArray(newValue) ? (newValue as CategoryOption[]) : ([newValue] as CategoryOption[])
          onChange(selected.map(strip))
          return
        }

        const selectedOne = Array.isArray(newValue) ? (newValue[0] as CategoryOption | undefined) : (newValue as CategoryOption)
        onChange(selectedOne ? [strip(selectedOne)] : [])
      }}
      loading={loading}
      noOptionsText={loading ? 'Loading...' : 'No categories available'}
      renderInput={(params) => {
        const hasValue = multiple 
          ? (Array.isArray(normalizedValue) && normalizedValue.length > 0)
          : (normalizedValue !== null && normalizedValue !== undefined)
        return (
          <TextField
            {...params}
            label={label || undefined}
            placeholder={placeholder}
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: hasValue || params.inputProps.value !== '' || false,
            }}
          />
        )
      }}
      renderTags={(value, getTagProps) =>
        (Array.isArray(value) ? value : []).map((option, index) => {
          const { displayLabel, level, ...category } = option
          return (
            <Chip
              label={category.name}
              {...getTagProps({ index })}
              key={category.id}
            />
          )
        })
      }
      renderOption={(props, option) => {
        const { displayLabel, level, ...category } = option
        const { key, ...otherProps } = props
        return (
          <Box
            key={key}
            component="li"
            {...otherProps}
            sx={{
              pl: `${level * 1.5 + 1}rem !important`,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {category.icon && (
              <i className={category.icon} style={{ fontSize: '1rem' }} />
            )}
            <Typography>{category.name}</Typography>
          </Box>
        )
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  )
}

