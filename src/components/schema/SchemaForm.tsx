'use client'

// React Imports
import { useState, useEffect, useMemo, useRef } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Avatar from '@mui/material/Avatar'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { FormSchema, FormField, FormFieldBlock } from '@/types/schema'
import type { OptionItem } from '@/services/options'

// Util Imports
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

// Service Imports
import { 
  fetchOptionsFromApi, 
  fetchAllOptionsFromCache, 
  getOptionsFromCache, 
  filterOptionsFromCache,
  type OptionItem as OptionItemType
} from '@/services/options'

type SchemaFormProps<T = any> = {
  schema: FormSchema
  initialData?: Partial<T>
  onSubmit?: (data: T) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  hideActions?: boolean
  hideTitle?: boolean
  formId?: string
  customFieldRenderer?: (field: FormField, value: any, onChange: (value: any) => void, error?: string) => React.ReactNode
}

export default function SchemaForm<T extends Record<string, any>>({
  schema,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  hideActions = false,
  hideTitle = false,
  formId,
  customFieldRenderer
}: SchemaFormProps<T>) {
  const t = useTranslations('admin')
  const [formData, setFormData] = useState<Partial<T>>(initialData || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, OptionItemType[]>>({})
  const [optionsLoading, setOptionsLoading] = useState<Record<string, boolean>>({})
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set())

  // Get fields from blocks or legacy fields
  const fields = useMemo(() => {
    if (schema.blocks) {
      return schema.blocks.flatMap(block => block.fields)
    }
    return schema.fields || []
  }, [schema])

  // Initialize options cache on mount
  useEffect(() => {
    const initOptions = async () => {
      // Check if any field needs cache
      const needsCache = fields.some(f => f.optionsSource === 'cache')
      if (needsCache) {
        await fetchAllOptionsFromCache()
      }
    }
    initOptions()
  }, [fields])

  // Check which fields have custom renderers (memoized to avoid repeated checks)
  const fieldsWithCustomRenderers = useMemo(() => {
    if (!customFieldRenderer) return new Set<string>()
    const customFields = new Set<string>()
    fields.forEach(field => {
      const testRender = customFieldRenderer(field, '', () => {}, '')
      if (testRender !== null && testRender !== undefined) {
        customFields.add(field.field)
      }
    })
    return customFields
  }, [fields, customFieldRenderer])

  // Load dynamic options for fields
  useEffect(() => {
    const loadOptions = async () => {
      for (const field of fields) {
        if ((field.type === 'select' || field.type === 'multiselect') && field.optionsSource) {
          // Skip if custom renderer is provided for this field
          if (fieldsWithCustomRenderers.has(field.field)) {
            continue
          }
          
          // For searchable fields, avoid fetching all data; only fetch when there is an initial value
          if (field.searchable) {
            const initialValue = (initialData as any)?.[field.field]
            if (initialValue !== undefined && initialValue !== null && initialValue !== '') {
              await fetchOptionsForField(field, String(initialValue))
            }
          } else {
            await fetchOptionsForField(field)
          }
        }
      }
    }
    loadOptions()
  }, [fields, initialData, fieldsWithCustomRenderers])

  // Fetch options helper (API or cache), supports search keyword
  const fetchOptionsForField = async (field: FormField, keyword?: string) => {
    if (field.optionsSource === 'api' && field.optionsApi) {
      if (field.searchable && (!keyword || !keyword.trim())) {
        // For searchable fields, skip fetching without a keyword to avoid large payloads
        return
      }
      setOptionsLoading(prev => ({ ...prev, [field.field]: true }))
      try {
        const searchParam = field.searchParam || 'q'
        // Build query: if keyword provided, add search param; otherwise fetch all
        let query = field.optionsApi
        if (keyword && keyword.trim()) {
          // Add search parameter if keyword is provided
          const separator = field.optionsApi.includes('?') ? '&' : '?'
          query = `${field.optionsApi}${separator}${searchParam}=${encodeURIComponent(keyword.trim())}`
        }
        const rawOptions = await fetchOptionsFromApi(query)
        const options = normalizeOptions(rawOptions, field)
        setDynamicOptions(prev => ({ ...prev, [field.field]: options }))
      } catch (error: any) {
        // Don't log 404 errors as errors - they might be expected for optional fields
        if (error?.status === 404) {
          console.warn(`Failed to load options for ${field.field} (404): ${field.optionsApi}. Options will be empty.`)
        } else {
          console.error(`Failed to load options for ${field.field}:`, error)
        }
        // Don't throw error, just log it - allow form to continue
        // Set empty options to prevent further errors
        setDynamicOptions(prev => ({ ...prev, [field.field]: [] }))
      } finally {
        setOptionsLoading(prev => ({ ...prev, [field.field]: false }))
      }
    } else if (field.optionsSource === 'cache' && field.optionsCode) {
      const rawOptions = getOptionsFromCache(field.optionsCode)
      const options = normalizeOptions(rawOptions, field)
      if (options.length > 0) {
        setDynamicOptions(prev => ({ ...prev, [field.field]: options }))
      }
    }
  }

  // Debounce timer refs for searchable fields
  const searchTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Normalize API options to { value, label }
  function normalizeOptions(raw: OptionItemType[], field?: FormField): OptionItemType[] {
    if (!Array.isArray(raw)) return []
    const template = field?.optionLabelTemplate
    return raw.map(item => {
      // Support value field mapping if specified
      const valueField = (field as any)?.optionsValueField || 'value'
      const labelField = (field as any)?.optionsLabelField || 'label'
      
      const value = (item as any)[valueField] ?? (item as any).value ?? (item as any).id ?? (item as any).code ?? ''
      const label = template
        ? applyTemplate(template, item)
        : (item as any)[labelField] ??
          (item as any).label ??
          (item as any).name ??
          (item as any).company_name ??
          (item as any).title ??
          ((item as any).user
            ? `${(item as any).user.first_name || ''} ${(item as any).user.last_name || ''}`.trim() ||
              (item as any).user.email ||
              (item as any).user.username ||
              (item as any).user.id
            : undefined) ??
          (item as any).customer_number ??
          String(value)
      return { ...item, value, label }
    })
  }

  function applyTemplate(template: string, obj: Record<string, any>) {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const val = getByPath(obj, path.trim())
      return val !== undefined && val !== null ? String(val) : ''
    })
  }

  function getByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
  }

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  async function handleChange(field: string, value: any) {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }

    // Handle filterOnChange for dependent select fields
    const dependentFields = fields.filter(f => f.filterOnChange === field)
    for (const dependentField of dependentFields) {
      if ((dependentField.type === 'select' || dependentField.type === 'multiselect') && dependentField.optionsSource) {
        const filterMode = dependentField.filterMode || 'local'
        
        if (filterMode === 'api' && dependentField.optionsApi) {
          // Fetch from API with filter parameter
          setOptionsLoading(prev => ({ ...prev, [dependentField.field]: true }))
          try {
            const filterParam = value ? `?${dependentField.filterOnChange}=${value}` : ''
            const options = await fetchOptionsFromApi(`${dependentField.optionsApi}${filterParam}`)
            setDynamicOptions(prev => ({ ...prev, [dependentField.field]: options }))
            // Clear dependent field value if it's no longer valid
            if (newFormData[dependentField.field] && !options.find(opt => opt.value === (newFormData as any)[dependentField.field])) {
              (newFormData as any)[dependentField.field] = ''
            }
          } catch (error) {
            console.error(`Failed to filter options for ${dependentField.field}:`, error)
          } finally {
            setOptionsLoading(prev => ({ ...prev, [dependentField.field]: false }))
          }
        } else if (filterMode === 'local' && dependentField.optionsCode) {
          // Filter from cache
          const filterFn = (item: OptionItemType) => {
            if (!value) return true
            // Check if item has a property matching the filter field
            return item[dependentField.filterOnChange!] === value
          }
          const filteredOptions = filterOptionsFromCache(dependentField.optionsCode, filterFn)
          setDynamicOptions(prev => ({ ...prev, [dependentField.field]: filteredOptions }))
          // Clear dependent field value if it's no longer valid
          if ((newFormData as any)[dependentField.field] && !filteredOptions.find(opt => opt.value === (newFormData as any)[dependentField.field])) {
            (newFormData as any)[dependentField.field] = ''
          }
        }
      }
    }
    
    setFormData(newFormData)
  }

  function validateField(field: FormField, value: any): string | null {
    if (field.required) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return `${field.label} ${t('common.schemaForm.isRequired')}`
        }
      } else if (!value || value === '') {
        return `${field.label} ${t('common.schemaForm.isRequired')}`
      }
    }

    if (field.validation) {
      const { min, max, pattern, message } = field.validation

      if (min !== undefined && value < min) {
        return message || `${field.label} ${t('common.schemaForm.mustBeAtLeast', { min })}`
      }

      if (max !== undefined && value > max) {
        return message || `${field.label} ${t('common.schemaForm.mustBeAtMost', { max })}`
      }

      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          return message || `${field.label} ${t('common.schemaForm.formatInvalid')}`
        }
      }
    }

    return null
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    fields.forEach((field) => {
      const value = formData[field.field]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.field] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (onSubmit) {
      await onSubmit(formData as T)
    }
  }

  function formatValue(field: FormField, value: any): string {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    switch (field.type) {
      case 'date':
        // For readonly fields, use custom format if provided
        if (field.readonly && field.format) {
          // If format is 'date', use default format; otherwise use as pattern
          if (field.format === 'date') {
            return formatDate(value)
          }
          return formatDate(value, field.format)
        }
        // Return ISO date string for date input
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]
        }
        if (typeof value === 'string' && value.includes('T')) {
          return value.split('T')[0]
        }
        return String(value)
      
      case 'datetime':
        // For readonly fields, use custom format if provided
        if (field.readonly && field.format) {
          // If format is 'datetime', use default format; otherwise use as pattern
          if (field.format === 'datetime') {
            return formatDateTime(value)
          }
          return formatDateTime(value, field.format)
        }
        // Return ISO datetime string for datetime-local input
        if (value instanceof Date) {
          return value.toISOString().slice(0, 16)
        }
        if (typeof value === 'string' && value.includes('T')) {
          return value.slice(0, 16)
        }
        return String(value)
      
      default:
        return String(value)
    }
  }

  function renderField(field: FormField) {
    const value = formData[field.field] ?? field.defaultValue ?? ''
    const error = errors[field.field]
    const isReadonly = field.readonly
    const labelNode = field.label

    // Use custom renderer if provided
    if (customFieldRenderer && !isReadonly) {
      const customRendered = customFieldRenderer(field, value, (newValue) => handleChange(field.field, newValue), error)
      if (customRendered !== null && customRendered !== undefined) {
        return customRendered
      }
    }

    // For readonly fields, render as display text
    if (isReadonly) {
      let displayValue = formatValue(field, value) || '-'
      
      // For select fields with displayTemplate, try to use data from API response
      if (field.type === 'select' && field.displayTemplate) {
        const dataKey = `${field.field}_data`
        const displayData = (initialData as any)?.[dataKey]
        if (displayData && typeof displayData === 'object') {
          const context = {
            ...initialData,
            ...displayData,
            [dataKey]: displayData
          }
          displayValue = applyTemplate(field.displayTemplate, context)
        }
      }
      
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {field.label}
            {field.required && <Typography component="span" color="error.main"> *</Typography>}
          </Typography>
          <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
            {displayValue}
          </Typography>
        </Box>
      )
    }

    // Common sx prop for required asterisk color
    const requiredAsteriskSx: any = field.required ? {
      '& .MuiInputLabel-asterisk': {
        color: 'error.main'
      }
    } : undefined

    const helperText = error || field.helperText

    switch (field.type) {
      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={labelNode}
            value={value}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={helperText}
            placeholder={field.placeholder}
            sx={requiredAsteriskSx}
          />
        )

      case 'string':
        return (
          <TextField
            fullWidth
            label={labelNode}
            value={value}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={helperText}
            placeholder={field.placeholder}
            sx={requiredAsteriskSx}
          />
        )

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={field.rows || 4}
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={helperText}
            placeholder={field.placeholder}
            sx={requiredAsteriskSx}
          />
        )

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.field, parseFloat(e.target.value) || 0)}
            required={field.required}
            error={!!error}
            helperText={helperText}
            placeholder={field.placeholder}
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max
            }}
            sx={requiredAsteriskSx}
          />
        )

      case 'currency':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.field, parseFloat(e.target.value) || 0)}
            required={field.required}
            error={!!error}
            helperText={helperText}
            placeholder={field.placeholder}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
            sx={requiredAsteriskSx}
          />
        )

      case 'select':
        // Get options from static, API, or cache
        let selectOptions: OptionItemType[] = []
        if (field.optionsSource === 'api' || field.optionsSource === 'cache') {
          selectOptions = dynamicOptions[field.field] || []
        } else {
          selectOptions = field.options || []
        }

        const isLoading = optionsLoading[field.field]

        // Legacy support: allow multi-value select using `multiple: true`
        if (field.multiple) {
          const selectedValues = Array.isArray(value) ? value : []
          return (
            <FormControl fullWidth required={field.required} error={!!error}>
              <Autocomplete
                multiple
                options={selectOptions}
                value={selectOptions.filter(opt => selectedValues.includes(opt.value))}
                onChange={(_, newValue) => handleChange(field.field, newValue.map(opt => opt.value))}
                loading={isLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={field.label}
                    required={field.required}
                    error={!!error}
                    helperText={helperText}
                    placeholder={field.placeholder}
                    sx={requiredAsteriskSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
                getOptionLabel={(option) => (option?.label ? String(option.label) : '')}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
              />
            </FormControl>
          )
        }

        // If searchable, use Autocomplete with server-side query
        if (field.searchable) {
          const selectedOption = selectOptions.find(opt => String(opt.value) === String(value)) || null
          return (
            <Autocomplete
              fullWidth
              options={selectOptions}
              loading={isLoading}
              value={selectedOption}
              onChange={(_, option) => handleChange(field.field, option?.value ?? '')}
              onInputChange={(_, input, reason) => {
                // Avoid firing search when value is set by selection or clear
                if (reason !== 'input') return
                if (searchTimers.current[field.field]) {
                  clearTimeout(searchTimers.current[field.field])
                }
                // Debounce search: wait 300ms after user stops typing
                searchTimers.current[field.field] = setTimeout(() => {
                  fetchOptionsForField(field, input)
                }, 300)
              }}
              getOptionLabel={(option) => (option?.label ? String(option.label) : '')}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
              filterOptions={(options) => options} // Disable client-side filtering, use server-side only
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={field.label}
                  required={field.required}
                  error={!!error}
                  helperText={error}
                  placeholder={field.placeholder || t('common.schemaForm.typeToSearch')}
                  sx={requiredAsteriskSx}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          )
        }

        return (
          <FormControl fullWidth required={field.required} error={!!error} sx={requiredAsteriskSx}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleChange(field.field, e.target.value)}
              disabled={isLoading}
            >
            {selectOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
            </Select>
            {(error || field.helperText) && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        )

      case 'multiselect':
        // Get options from static, API, or cache
        let multiSelectOptions: OptionItemType[] = []
        if (field.optionsSource === 'api' || field.optionsSource === 'cache') {
          multiSelectOptions = dynamicOptions[field.field] || []
        } else {
          multiSelectOptions = field.options || []
        }

        const multiIsLoading = optionsLoading[field.field]
        const selectedValues = Array.isArray(value) ? value : []

        return (
          <FormControl fullWidth required={field.required} error={!!error}>
            <Autocomplete
              multiple
              options={multiSelectOptions}
              value={multiSelectOptions.filter(opt => selectedValues.includes(opt.value))}
              onChange={(_, newValue) => handleChange(field.field, newValue.map(opt => opt.value))}
              loading={multiIsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={field.label}
                  required={field.required}
                  error={!!error}
                  helperText={helperText}
                  placeholder={field.placeholder}
                  sx={requiredAsteriskSx}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {multiIsLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.value}
                  />
                ))
              }
              getOptionLabel={(option) => (option?.label ? String(option.label) : '')}
              isOptionEqualToValue={(opt, val) => opt.value === val.value}
            />
          </FormControl>
        )

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleChange(field.field, e.target.checked)}
              />
            }
            label={field.label}
          />
        )

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.label}
            value={formatValue(field, value)}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
            InputLabelProps={{ shrink: true }}
            sx={requiredAsteriskSx}
          />
        )

      case 'datetime':
        return (
          <TextField
            fullWidth
            type="datetime-local"
            label={field.label}
            value={formatValue(field, value)}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
            InputLabelProps={{ shrink: true }}
            sx={requiredAsteriskSx}
          />
        )

      case 'color':
        return (
          <Box>
            <TextField
              fullWidth
              type="color"
              label={field.label}
              value={value || '#000000'}
              onChange={(e) => handleChange(field.field, e.target.value)}
              required={field.required}
              error={!!error}
              helperText={error}
              InputLabelProps={{ shrink: true }}
              sx={requiredAsteriskSx}
            />
          </Box>
        )

      case 'image':
      case 'file':
        return (
          <Box>
            <InputLabel>{field.label}</InputLabel>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
              {field.type === 'image' && value && (
                <Avatar src={value} alt="" sx={{ width: 80, height: 80 }} variant="rounded" />
              )}
              <Button variant="outlined" component="label">
                {t('common.schemaForm.upload')}
                <input
                  type="file"
                  hidden
                  accept={field.accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (field.type === 'image') {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          handleChange(field.field, event.target?.result)
                        }
                        reader.readAsDataURL(file)
                      } else {
                        handleChange(field.field, file)
                      }
                    }
                  }}
                />
              </Button>
              {value && typeof value === 'string' && field.type === 'file' && (
                <Typography variant="body2" color="text.secondary">
                  {value}
                </Typography>
              )}
            </Box>
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Box>
        )

      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
            sx={requiredAsteriskSx}
          />
        )
    }
  }

  function toggleBlock(index: number) {
    setCollapsedBlocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  function renderBlock(block: FormFieldBlock, blockIndex: number) {
    const isCollapsed = collapsedBlocks.has(blockIndex)
    const isCollapsible = block.className === 'collapse'

    const blockContent = (
      <Grid container spacing={4}>
        {block.fields.map((field) => (
          <Grid
            key={field.field}
            size={{
              xs: 12,
              md: field.fullWidth || field.newline ? 12 : (field.type === 'textarea' || field.type === 'image' || field.type === 'file' ? 12 : 6)
            }}
          >
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
    )

    if (isCollapsible) {
      return (
        <Box key={blockIndex} sx={{ mb: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: 4,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1
            }}
            onClick={() => toggleBlock(blockIndex)}
          >
            <Typography variant="h6">{block.title || t('common.schemaForm.details')}</Typography>
            <IconButton size="small">
              <i className={isCollapsed ? 'tabler-chevron-down' : 'tabler-chevron-up'} />
            </IconButton>
          </Box>
          <Collapse in={!isCollapsed}>
            {blockContent}
          </Collapse>
        </Box>
      )
    }

    return (
      <Box key={blockIndex} sx={{ mb: 3 }} className={block.className}>
        {block.title && (
          <Typography variant="h6" sx={{ mb: 3 }}>
            {block.title}
          </Typography>
        )}
        {blockContent}
      </Box>
    )
  }

  // Render fields in blocks or legacy format
  function renderFields() {
    if (schema.blocks) {
      return schema.blocks.map((block, index) => renderBlock(block, index))
    }
    
    // Legacy: render fields directly
    return (
      <Grid container spacing={4}>
        {fields.map((field) => (
          <Grid
            key={field.field}
            size={{
              xs: 12,
              md: field.fullWidth || field.newline ? 12 : (field.type === 'textarea' || field.type === 'image' || field.type === 'file' ? 12 : 6)
            }}
          >
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Card>
      <CardContent>
        {!hideTitle && schema.title && (
          <Typography variant="h5" sx={{ mb: 4 }}>
            {schema.title}
          </Typography>
        )}

        <form id={formId} onSubmit={handleSubmit}>
          {renderFields()}

          {!hideActions && (
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel} disabled={loading}>
                  {t('common.schemaForm.cancel')}
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? t('common.schemaForm.saving') : t('common.schemaForm.save')}
              </Button>
            </Box>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

