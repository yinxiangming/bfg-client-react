'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'

/**
 * Schema field definition from plugin
 */
export type SchemaFieldDefinition = {
  type: 'string' | 'number' | 'integer' | 'boolean'
  required?: boolean
  sensitive?: boolean
  description?: string
  default?: any
  /** When type is string, render as multiline textarea (e.g. for note/instructions) */
  multiline?: boolean
}

/**
 * Plugin configuration schema
 */
export type ConfigSchema = Record<string, SchemaFieldDefinition>

type SchemaConfigEditorProps = {
  schema: ConfigSchema
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

/**
 * Generic component for editing plugin configuration based on schema
 * Used for Carrier plugins, Gateway plugins, etc.
 */
export default function SchemaConfigEditor({
  schema,
  value,
  onChange,
  errors = {},
  disabled = false
}: SchemaConfigEditorProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    const newValue = { ...value, [fieldName]: fieldValue }
    onChange(newValue)
  }

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const renderField = (fieldName: string, fieldDef: SchemaFieldDefinition) => {
    // Get field value with proper fallback chain
    let fieldValue = value[fieldName]
    if (fieldValue === undefined || fieldValue === null) {
      fieldValue = fieldDef.default
    }
    // For numeric types, use proper defaults
    if ((fieldDef.type === 'number' || fieldDef.type === 'integer') && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
      fieldValue = fieldDef.default ?? 0
    }
    // For string types, use empty string if no value
    if (fieldDef.type === 'string' && (fieldValue === undefined || fieldValue === null)) {
      fieldValue = ''
    }
    
    const error = errors[fieldName]
    const isPassword = fieldDef.sensitive && fieldDef.type === 'string'
    const showPassword = showPasswords[fieldName] || false

    switch (fieldDef.type) {
      case 'string':
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={fieldDef.required}
            error={!!error}
            helperText={error || fieldDef.description}
            disabled={disabled}
            type={isPassword && !showPassword ? 'password' : 'text'}
            multiline={fieldDef.multiline}
            rows={fieldDef.multiline ? 4 : undefined}
            InputProps={
              isPassword
                ? {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility(fieldName)}
                          edge="end"
                          size="small"
                        >
                          <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                : undefined
            }
            sx={{
              '& .MuiInputLabel-asterisk': {
                color: 'error.main'
              }
            }}
          />
        )

      case 'number':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="number"
            value={fieldValue}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
              handleFieldChange(fieldName, isNaN(val) ? 0 : val)
            }}
            required={fieldDef.required}
            error={!!error}
            helperText={error || fieldDef.description}
            disabled={disabled}
            sx={{
              '& .MuiInputLabel-asterisk': {
                color: 'error.main'
              }
            }}
          />
        )

      case 'integer':
        return (
          <TextField
            fullWidth
            label={fieldName}
            type="number"
            value={fieldValue}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
              handleFieldChange(fieldName, isNaN(val) ? 0 : val)
            }}
            required={fieldDef.required}
            error={!!error}
            helperText={error || fieldDef.description}
            disabled={disabled}
            inputProps={{ step: 1 }}
            sx={{
              '& .MuiInputLabel-asterisk': {
                color: 'error.main'
              }
            }}
          />
        )

      case 'boolean':
        // For boolean fields, we'll use a text field with "true"/"false" for now
        // Can be enhanced to use Switch component if needed
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={fieldValue ? 'true' : 'false'}
            onChange={(e) => handleFieldChange(fieldName, e.target.value === 'true')}
            required={fieldDef.required}
            error={!!error}
            helperText={error || fieldDef.description}
            disabled={disabled}
            select
            SelectProps={{
              native: true
            }}
            sx={{
              '& .MuiInputLabel-asterisk': {
                color: 'error.main'
              }
            }}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </TextField>
        )

      default:
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={fieldValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={fieldDef.required}
            error={!!error}
            helperText={error || fieldDef.description}
            disabled={disabled}
            sx={{
              '& .MuiInputLabel-asterisk': {
                color: 'error.main'
              }
            }}
          />
        )
    }
  }

  // Get all field names from both schema and existing values
  const schemaFields = new Set(Object.keys(schema))
  const valueFields = new Set(Object.keys(value || {}))
  const allFields = new Set([...schemaFields, ...valueFields])
  const fieldNames = Array.from(allFields).sort()

  if (fieldNames.length === 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary', fontStyle: 'italic' }}>
        No configuration fields defined
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {fieldNames.map((fieldName) => {
        const fieldDef = schema[fieldName]
        
        // If field is in value but not in schema, render as string
        if (!fieldDef) {
          const fieldValue = value[fieldName] ?? ''
          return (
            <Grid key={fieldName} size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={`${fieldName} (custom)`}
                value={typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue)}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                disabled={disabled}
                helperText="Custom field not defined in schema"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'warning.main'
                  }
                }}
              />
            </Grid>
          )
        }
        
        return (
          <Grid key={fieldName} size={{ xs: 12, md: 6 }}>
            {renderField(fieldName, fieldDef)}
          </Grid>
        )
      })}
    </Grid>
  )
}
