// Schema types for Schema-Driven UI

export type FieldType =
  | 'string'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'boolean'
  | 'textarea'
  | 'image'
  | 'currency'
  | 'file'
  | 'color'
  | 'multiselect'

export interface SchemaColumn {
  field: string
  label: string
  type: FieldType
  width?: number
  sortable?: boolean
  options?: Array<{ value: string | number; label: string }>
  render?: (value: any, row: any) => React.ReactNode
  link?: string // Action ID to trigger when column is clicked (e.g., 'edit', 'view')
}

export interface SchemaFilter {
  field: string
  label: string
  type: FieldType
  options?: Array<{ value: string | number; label: string }>
  // Select field enhancements (same as FormField)
  optionsSource?: 'static' | 'api' | 'cache' // Source of options: static (from options), api (from server), cache (from cached data)
  optionsApi?: string // API endpoint to fetch options
  optionsCode?: string // Code to filter cached options (used with optionsSource: 'cache')
  filterMode?: 'api' | 'local' // Filter mode: 'api' (send to server) or 'local' (filter client-side), default: 'local'
}

export interface SchemaAction {
  id: string
  label: string
  type?: 'primary' | 'secondary' | 'danger' | 'success'
  scope: 'global' | 'row'
  confirm?: string
  icon?: string
}

export interface ListSchema {
  title: string
  columns: SchemaColumn[]
  filters?: SchemaFilter[]
  searchFields?: string[]
  searchPlaceholder?: string
  actions?: SchemaAction[]
}

export interface FormField {
  field: string
  label: string
  type: FieldType
  required?: boolean
  readonly?: boolean
  newline?: boolean // If true, start on a new row (full width)
  fullWidth?: boolean // If true, field takes full row width (default: false)
  placeholder?: string
  helperText?: string
  options?: Array<{ value: string | number; label: string }>
  multiple?: boolean // For select: allow multiple values (legacy; prefer type: 'multiselect')
  // Select field enhancements
  optionsSource?: 'static' | 'api' | 'cache' // Source of options: static (from options), api (from server), cache (from cached data)
  optionsApi?: string // API endpoint to fetch options
  optionsCode?: string // Code to filter cached options (used with optionsSource: 'cache')
  optionsValueField?: string // Field name to use as value (default: 'value')
  optionsLabelField?: string // Field name to use as label (default: 'label')
  filterOnChange?: string // Field name that triggers filter when changed
  filterMode?: 'api' | 'local' // Filter mode: 'api' (fetch from server) or 'local' (filter cached data), default: 'local'
  optionLabelTemplate?: string // Template for option labels in dropdown (e.g. "{{user.first_name}} {{user.last_name}} ({{company_name}})")
  displayTemplate?: string // Template for displaying selected value (e.g. "{{user.first_name}} {{user.last_name}} ({{email}})")
  searchable?: boolean // For select: enable server-side search
  searchParam?: string // Query param name for search (default: 'q')
  format?: string // Format option for date/datetime fields (e.g., 'date', 'datetime', 'time', 'relative')
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  defaultValue?: any
  rows?: number // For textarea fields
  accept?: string // For file/image fields
}

export interface FormFieldBlock {
  title?: string
  className?: string // CSS class for the block (e.g., 'collapse')
  fields: FormField[]
}

export interface FormSchema {
  title: string
  fields?: FormField[] // Deprecated: use blocks instead
  blocks?: FormFieldBlock[] // New: grouped fields in blocks
  actions?: Array<{
    id: string
    label: string
    type?: 'submit' | 'cancel'
  }>
}

export interface SchemaResponse {
  list?: ListSchema
  form?: FormSchema
}

