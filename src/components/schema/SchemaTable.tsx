'use client'

// React Imports
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Avatar from '@mui/material/Avatar'
import Pagination from '@mui/material/Pagination'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Checkbox from '@mui/material/Checkbox'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomTextField from '@/components/ui/TextField'
import FilterDateRangePicker, { toDateOnly } from '@/components/schema/FilterDateRangePicker'
import StatusBadge from '@/components/schema/StatusBadge'

// Type Imports
import type { ListSchema, SchemaAction, SchemaFilter, SchemaSummaryField } from '@/types/schema'

// Util Imports
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

// Service Imports
import {
  fetchOptionsFromApi,
  fetchAllOptionsFromCache,
  getOptionsFromCache,
  type OptionItem as OptionItemType
} from '@/services/options'

// Style Imports
import tableStyles from '@/styles/table.module.css'

// Date range preset helpers (date-only YYYY-MM-DD for API)
function formatDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getPresetRange(preset: 'today' | 'yesterday' | 'last_week'): { start: string; end: string } {
  const now = new Date()
  if (preset === 'today') {
    return { start: formatDateOnly(now), end: formatDateOnly(now) }
  }
  if (preset === 'yesterday') {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return { start: formatDateOnly(d), end: formatDateOnly(d) }
  }
  const lastSun = new Date(now)
  lastSun.setDate(now.getDate() - now.getDay() - 1)
  const lastMon = new Date(lastSun)
  lastMon.setDate(lastSun.getDate() - 6)
  return { start: formatDateOnly(lastMon), end: formatDateOnly(lastSun) }
}

function getDateRangePreset(start: string, end: string): '' | 'today' | 'yesterday' | 'last_week' | 'custom' {
  if (!start && !end) return ''
  const rToday = getPresetRange('today')
  if (start === rToday.start && end === rToday.end) return 'today'
  const rYesterday = getPresetRange('yesterday')
  if (start === rYesterday.start && end === rYesterday.end) return 'yesterday'
  const rLastWeek = getPresetRange('last_week')
  if (start === rLastWeek.start && end === rLastWeek.end) return 'last_week'
  return 'custom'
}

// Format a summary aggregate for display in the summary bar (WI-391).
function formatSummaryValue(value: string | number | null | undefined, field: SchemaSummaryField): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(value)
  if (field.format === 'currency') return formatCurrency(Number.isFinite(num) ? num : 0)
  if (field.format === 'integer' || field.format === 'number') {
    return Number.isFinite(num) ? num.toLocaleString() : String(value)
  }
  // decimal (default): server pre-formats precision; add thousands grouping when numeric
  return Number.isFinite(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(value)
}

type SchemaTableProps<T = any> = {
  schema: ListSchema
  data: T[]
  loading?: boolean
  onActionClick?: (action: SchemaAction, item: T) => void
  onRowClick?: (item: T) => void
  basePath?: string
  fetchDetailFn?: (id: number | string) => Promise<T> // Function to fetch detail when editing
  statusColors?: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> // Custom status color mapping
  customFilters?: React.ReactNode // Custom filter components to render in the toolbar
  /** Controlled filters for API-mode filtering: parent passes params and refetches when they change */
  filters?: Record<string, string>
  onFiltersChange?: (filters: Record<string, string>) => void
  /** Server-side pagination: when provided, data is the current page and client-side filtering/pagination are skipped */
  serverPagination?: {
    total: number
    page: number
    rowsPerPage: number
    onPageChange: (page: number) => void
    onRowsPerPageChange: (rowsPerPage: number) => void
  }
  /** Called with debounced search string when server-side pagination is active */
  onSearchChange?: (search: string) => void
  /** Aggregate stats for the summary bar, keyed by SchemaSummaryField.key (WI-391). */
  summary?: Record<string, string | number | null>
  summaryLoading?: boolean
  /** Total rows matching the current filters; enables cross-page "select all N".
   *  Falls back to serverPagination.total, then the local filtered count. */
  totalCount?: number
  /** Notifies the container of the current selection so it can run bulk actions
   *  by id-set (page selection) or by filter (all-matching). */
  onSelectionChange?: (selection: { ids: (number | string)[]; allMatching: boolean; total: number }) => void
}

// Default status colors - only common/generic statuses
const defaultStatusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  // Common statuses
  active: 'success',
  inactive: 'default',
  enabled: 'success',
  disabled: 'default',
  
  // Process statuses
  pending: 'warning',
  processing: 'warning',
  completed: 'success',
  cancelled: 'error',
  failed: 'error',
  
  // Draft/Published
  draft: 'default',
  published: 'success',
  
  // Generic yes/no
  yes: 'success',
  no: 'default',
  true: 'success',
  false: 'default'
}

// Debounced Input Component
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

export default function SchemaTable<T extends { id: number | string }>({
  schema,
  data,
  loading = false,
  onActionClick,
  onRowClick,
  basePath,
  fetchDetailFn,
  statusColors = defaultStatusColors,
  customFilters,
  filters: controlledFilters,
  onFiltersChange,
  serverPagination,
  onSearchChange,
  summary,
  summaryLoading,
  totalCount,
  onSelectionChange
}: SchemaTableProps<T>) {
  const t = useTranslations('admin')
  // State
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>({})
  const filters = controlledFilters !== undefined ? controlledFilters : internalFilters
  const setFilters = useCallback(
    (next: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
      if (onFiltersChange) {
        const nextVal = typeof next === 'function' ? next(filters) : next
        onFiltersChange(nextVal)
      } else {
        setInternalFilters(typeof next === 'function' ? next(internalFilters) : next)
      }
    },
    [onFiltersChange, filters, internalFilters]
  )
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ el: HTMLElement; item: T } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: SchemaAction; item: T } | null>(null)
  const [filterOptions, setFilterOptions] = useState<Record<string, OptionItemType[]>>({})
  const [filterOptionsLoading, setFilterOptionsLoading] = useState<Record<string, boolean>>({})
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set())
  // Cross-page "select all N matching" mode (WI-391): selection spans the whole
  // filtered result set, not just the rows held client-side on the current page.
  const [allMatchingSelected, setAllMatchingSelected] = useState(false)
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState<HTMLElement | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<boolean>(false)
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState<string | null>(null)
  const [dateRangeDraft, setDateRangeDraft] = useState<Record<string, { start: string; end: string }>>({})
  const [dateRangeDropdownValue, setDateRangeDropdownValue] = useState<Record<string, string>>({})
  const [dateRangeIncludeTime, setDateRangeIncludeTime] = useState<Record<string, boolean>>({})

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Notify parent when search changes in server-pagination mode.
  // Only fire when debouncedSearch actually changes — do NOT include the
  // unstable serverPagination / onSearchChange props in deps, otherwise the
  // effect would fire on every render and repeatedly reset pagination.
  const onSearchChangeRef = useRef(onSearchChange)
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange
  })
  const didMountSearchRef = useRef(false)
  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true
      return
    }
    onSearchChangeRef.current?.(debouncedSearch)
  }, [debouncedSearch])

  // Load filter options dynamically
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!schema.filters || schema.filters.length === 0) return

      // Check if any filter needs cache
      const needsCache = schema.filters.some(f => f.optionsSource === 'cache')
      if (needsCache) {
        await fetchAllOptionsFromCache()
      }

      // Load options for each filter
      const loadPromises = schema.filters.map(async (filter) => {
        if (filter.type === 'select' && filter.optionsSource) {
          setFilterOptionsLoading(prev => ({ ...prev, [filter.field]: true }))
          try {
            if (filter.optionsSource === 'api' && filter.optionsApi) {
              const raw = await fetchOptionsFromApi(filter.optionsApi)
              const valueField = filter.optionsValueField ?? 'id'
              const labelField = filter.optionsLabelField ?? 'name'
              const options = Array.isArray(raw)
                ? raw.map((item: any) => ({
                    value: item[valueField] ?? item.value ?? item.id,
                    label: String(item[labelField] ?? item.label ?? item.name ?? '')
                  }))
                : raw
              setFilterOptions(prev => ({ ...prev, [filter.field]: options || [] }))
            } else if (filter.optionsSource === 'cache' && filter.optionsCode) {
              const options = getOptionsFromCache(filter.optionsCode)
              if (options.length > 0) {
                setFilterOptions(prev => ({ ...prev, [filter.field]: options }))
              }
            }
          } catch (error) {
            console.error(`Failed to load filter options for ${filter.field}:`, error)
          } finally {
            setFilterOptionsLoading(prev => ({ ...prev, [filter.field]: false }))
          }
        }
      })

      await Promise.all(loadPromises)
    }

    loadFilterOptions()
  }, [schema.filters])

  // Filter and search data
  const filteredData = useMemo(() => {
    // When server pagination is active, data is already the current page — skip client-side processing
    if (serverPagination) return Array.isArray(data) ? [...data] : []
    let result = Array.isArray(data) ? [...data] : []

    // Apply search
    if (debouncedSearch && schema.searchFields) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(item =>
        schema.searchFields!.some(field => {
          const value = getNestedValue(item, field)
          return value?.toString().toLowerCase().includes(searchLower)
        })
      )
    }

    // Collect daterange sub-fields (startField/endField) that are API-managed
    const dateRangeApiFields = new Set<string>()
    schema.filters?.forEach(f => {
      if (f.type === 'daterange' && f.dateRange && f.filterMode === 'api') {
        dateRangeApiFields.add(f.dateRange.startField)
        dateRangeApiFields.add(f.dateRange.endField)
      }
    })

    // Apply filters (only for local filter mode)
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        if (dateRangeApiFields.has(field)) return
        const filterConfig = schema.filters?.find(f => f.field === field)
        // Only apply local filtering if filterMode is 'local' or not specified
        if (!filterConfig || filterConfig.filterMode !== 'api') {
          result = result.filter(item => {
            const itemValue = getNestedValue(item, field)
            // Handle boolean filter
            if (value === 'true' || value === 'false') {
              return itemValue?.toString() === value
            }
            return String(itemValue) === String(value)
          })
        }
      }
    })

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortField)
        const bValue = getNestedValue(b, sortField)
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, debouncedSearch, filters, sortField, sortDirection, schema.searchFields, schema.filters])

  // Pagination
  const paginatedData = useMemo(() => {
    if (serverPagination) return filteredData
    const start = page * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [serverPagination, filteredData, page, rowsPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, filters, sortField, sortDirection])

  // Helper functions
  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  function formatValue(value: any, type: string): React.ReactNode {
    if (value === null || value === undefined) return '-'

    switch (type) {
      case 'currency':
        return formatCurrency(value)
      case 'date':
        return formatDate(value)
      case 'datetime':
        return formatDateTime(value)
      case 'image':
        return (
          <Avatar
            src={value}
            alt=""
            sx={{ width: 40, height: 40 }}
            variant="rounded"
          >
            <i className="tabler-image" />
          </Avatar>
        )
      case 'select':
        // Handle boolean values
        if (typeof value === 'boolean') {
          // Note: These labels should ideally come from schema or data
          // For now, using generic status labels
          return (
            <StatusBadge
              label={value ? t('common.states.active', { defaultValue: 'Active' }) : t('common.states.inactive', { defaultValue: 'Inactive' })}
              color={value ? 'success' : 'default'}
            />
          )
        }
        // Handle array values (like warehouses)
        if (Array.isArray(value)) {
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {value.map((item, idx) => (
                <StatusBadge key={idx} label={item} color="default" noDot />
              ))}
            </Box>
          )
        }
        return <StatusBadge label={value} color={statusColors[value] || 'default'} />
      default:
        // Format file size for media
        if (typeof value === 'number' && value > 1024) {
          const kb = value / 1024
          const mb = kb / 1024
          if (mb >= 1) {
            return `${mb.toFixed(2)} MB`
          }
          return `${kb.toFixed(2)} KB`
        }
        return value?.toString() || '-'
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  function handleActionClick(action: SchemaAction, item: T) {
    if (action.confirm) {
      setConfirmDialog({ action, item })
      setActionMenuAnchor(null)
    } else {
      executeAction(action, item)
    }
  }

  async function executeAction(action: SchemaAction, item: T) {
    // For edit action, fetch detail if fetchDetailFn is provided
    if (action.id === 'edit' && fetchDetailFn && item && typeof item === 'object' && 'id' in item) {
      try {
        const itemId = (item as any).id
        if (itemId !== undefined && itemId !== null) {
          const detailItem = await fetchDetailFn(itemId)
          // Call onActionClick with detail item
          if (onActionClick) {
            onActionClick(action, detailItem)
          }
          return
        }
      } catch (error) {
        console.error('Failed to fetch detail:', error)
        // Fall through to use original item if fetch fails
      }
    }

    // For other actions or if fetchDetailFn is not provided
    if (onActionClick) {
      onActionClick(action, item)
    }
  }

  async function handleConfirmAction() {
    if (confirmDialog) {
      await executeAction(confirmDialog.action, confirmDialog.item)
      setConfirmDialog(null)
    }
  }

  async function handleBulkDelete() {
    const selectedIds = Array.from(selectedRows)
    if (selectedIds.length === 0 || !onActionClick) return

    const deleteAction: SchemaAction = {
      id: 'delete',
      label: 'Delete',
      type: 'danger',
      scope: 'row'
    }

    try {
      // Delete each selected item (use filteredData to find items)
      for (const id of selectedIds) {
        const item = filteredData.find(d => d.id === id)
        if (item) {
          await onActionClick(deleteAction, item)
        }
      }
      // Clear selection after deletion
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Bulk delete error:', error)
    } finally {
      setBulkDeleteConfirm(false)
      setBulkActionMenuAnchor(null)
    }
  }

  const globalActions = schema.actions?.filter(a => a.scope === 'global') || []
  const rowActions = schema.actions?.filter(a => a.scope === 'row') || []

  const _sp = serverPagination
  const displayTotal = _sp ? _sp.total : filteredData.length
  const displayPage = _sp ? _sp.page : page
  const displayRowsPerPage = _sp ? _sp.rowsPerPage : rowsPerPage
  const totalPages = Math.ceil(displayTotal / displayRowsPerPage)
  const startIndex = displayTotal === 0 ? 0 : displayPage * displayRowsPerPage + 1
  const endIndex = Math.min((displayPage + 1) * displayRowsPerPage, displayTotal)

  // Total rows matching the current filters — drives the "select all N" affordance.
  const matchingTotal = totalCount ?? (_sp ? _sp.total : filteredData.length)

  // Row selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAllMatchingSelected(false)
    if (event.target.checked) {
      const newSelected = new Set(paginatedData.map(item => item.id))
      setSelectedRows(newSelected)
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: number | string) => {
    // Any manual toggle drops out of cross-page "all matching" mode.
    setAllMatchingSelected(false)
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  // Cross-page select-all (WI-391): mark the entire filtered set as selected.
  const handleSelectAllMatching = () => {
    setAllMatchingSelected(true)
    setSelectedRows(new Set(paginatedData.map(item => item.id)))
  }

  const handleClearSelection = () => {
    setAllMatchingSelected(false)
    setSelectedRows(new Set())
  }

  const isAllSelected =
    allMatchingSelected || (paginatedData.length > 0 && paginatedData.every(item => selectedRows.has(item.id)))
  const isIndeterminate = !allMatchingSelected && selectedRows.size > 0 && selectedRows.size < paginatedData.length

  // Surface the live selection to the container so it can run bulk actions by
  // id-set (page selection) or by filter (all-matching). Ref-guarded so an
  // unstable callback prop does not re-fire the effect every render.
  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange })
  useEffect(() => {
    onSelectionChangeRef.current?.({
      ids: Array.from(selectedRows),
      allMatching: allMatchingSelected,
      total: allMatchingSelected ? matchingTotal : selectedRows.size
    })
  }, [selectedRows, allMatchingSelected, matchingTotal])

  // Selected-row summary (WI-399): when summaryConfig fields declare a `sumField`,
  // the bar aggregates client-side over the loaded rows — the selected rows when a
  // selection is active, else the full filtered set. A server-provided `summary`
  // still wins for the whole-set view (covers aggregates the client can't compute,
  // e.g. declared value derived from related records).
  const sumFields = useMemo(
    () => schema.summaryConfig?.fields.filter(f => f.sumField) ?? [],
    [schema.summaryConfig]
  )
  const hasSelection = selectedRows.size > 0 || allMatchingSelected
  const selectionSummary = useMemo(() => {
    if (sumFields.length === 0 || !hasSelection) return null
    const rows = allMatchingSelected ? filteredData : data.filter(d => selectedRows.has(d.id))
    const out: Record<string, number> = {}
    for (const f of sumFields) {
      out[f.key] = f.sumField === '__count__'
        ? rows.length
        : rows.reduce((acc, r) => acc + (Number((r as Record<string, unknown>)[f.sumField as string]) || 0), 0)
    }
    return out
  }, [sumFields, hasSelection, allMatchingSelected, filteredData, data, selectedRows])
  const computedAllSummary = useMemo(() => {
    if (sumFields.length === 0 || summary) return null
    const out: Record<string, number> = {}
    for (const f of sumFields) {
      out[f.key] = f.sumField === '__count__'
        ? filteredData.length
        : filteredData.reduce((acc, r) => acc + (Number((r as Record<string, unknown>)[f.sumField as string]) || 0), 0)
    }
    return out
  }, [sumFields, summary, filteredData])
  const summaryIsSelection = !!selectionSummary
  const effectiveSummary = selectionSummary ?? summary ?? computedAllSummary ?? undefined

  return (
    <>
      <Card
        elevation={0}
        className="at-schema-table"
        sx={{
          backgroundColor: 'var(--at-card-bg, var(--mui-palette-background-paper))',
          boxShadow: 'var(--at-card-shadow, none)',
          border: '1px solid',
          borderColor: 'var(--at-card-border, var(--mui-palette-divider))',
          borderRadius: 'var(--at-card-radius, 8px)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Prevent card from overflowing
        }}
      >

        {/* Summary bar — aggregates the whole filtered result set, not just the
            current page (WI-391). Driven by schema.summaryConfig + summary prop. */}
        {schema.summaryConfig && (effectiveSummary || summaryLoading) && (
          <CardContent
            sx={{
              py: 1.25, px: 3, borderBottom: '1px solid', borderColor: 'var(--at-divider, var(--mui-palette-divider))',
              display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'baseline',
              backgroundColor: summaryIsSelection
                ? 'var(--at-selected-bg, rgba(105,108,255,0.08))'
                : 'var(--at-subtle-bg, rgba(0,0,0,0.02))'
            }}
          >
            {summaryLoading && !effectiveSummary ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">{t('common.schemaTable.loadingStats')}</Typography>
              </Box>
            ) : (
              <>
                {summaryIsSelection && (
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {t('common.schemaTable.selectionSummaryLabel')}
                  </Typography>
                )}
                {schema.summaryConfig.fields.map(field => (
                  <Box key={field.key} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {field.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatSummaryValue(effectiveSummary?.[field.key], field)}{field.unit ? ` ${field.unit}` : ''}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        )}

        {/* Selection banner — page selection count + cross-page "select all N" (WI-391) */}
        {(selectedRows.size > 0 || allMatchingSelected) && (
          <CardContent
            sx={{
              py: 1, px: 3, borderBottom: '1px solid', borderColor: 'var(--at-divider, var(--mui-palette-divider))',
              display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap',
              backgroundColor: 'var(--at-selected-bg, rgba(105,108,255,0.08))'
            }}
          >
            <Typography variant="body2">
              {allMatchingSelected
                ? t('common.schemaTable.selectedAllMatching', { count: matchingTotal })
                : t('common.schemaTable.selectedCount', { count: selectedRows.size })}
            </Typography>
            {!allMatchingSelected && isAllSelected && matchingTotal > paginatedData.length && (
              <Button size="small" variant="text" onClick={handleSelectAllMatching} sx={{ textTransform: 'none' }}>
                {t('common.schemaTable.selectAllMatching', { count: matchingTotal })}
              </Button>
            )}
            <Button size="small" variant="text" color="error" onClick={handleClearSelection} sx={{ textTransform: 'none' }}>
              {t('common.schemaTable.clearSelection')}
            </Button>
          </CardContent>
        )}

        {/* Toolbar with Search, Filters, and Actions */}
        <CardContent sx={{ py: 2, px: 3, borderBottom: '1px solid', borderColor: 'var(--at-divider, var(--mui-palette-divider))' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Search */}
            {schema.searchFields && (
              <DebouncedInput
                value={search}
                onChange={value => setSearch(String(value))}
                placeholder={schema.searchPlaceholder || t('common.schemaTable.searchPlaceholder')}
                size="small"
                sx={{ 
                  minWidth: 200, 
                  flexGrow: { xs: 1, sm: 0 },
                  maxWidth: 320,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    height: '38px'
                  }
                }}
              />
            )}

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 120, 
                  textTransform: 'none', 
                  fontWeight: 500,
                  borderRadius: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  height: '40px',
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: 'divider',
                    backgroundColor: 'grey.50'
                  }
                }}
              >
                {t('common.schemaTable.bulkActions')}
                <i className="tabler-chevron-down ml-1" style={{ fontSize: '1rem' }} />
              </Button>
            )}

            {/* Custom Filters */}
            {customFilters && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {customFilters}
              </Box>
            )}

            {/* Filters */}
            {schema.filters && schema.filters.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {schema.filters.map((filter) => {
                  if (filter.type === 'daterange' && filter.dateRange) {
                    const dr = filter.dateRange
                    const startField = dr.startField
                    const endField = dr.endField
                    const rangeOptionValue = dr.rangeOptionValue ?? 'custom'
                    const startVal = filters[startField] ?? ''
                    const endVal = filters[endField] ?? ''
                    const presetFromRange = startVal || endVal ? getDateRangePreset(startVal, endVal) : ''
                    const dropdownValue =
                      startVal || endVal
                        ? presetFromRange || rangeOptionValue
                        : dateRangeDropdownValue[filter.field] ?? ''
                    const presets = ['today', 'yesterday', 'last_week'] as const
                    const daterangeOptions =
                      filter.options?.length ? filter.options : [
                        { value: '', label: t('common.schemaTable.all') },
                        ...presets.map((p) => ({ value: p, label: t(`common.schemaTable.dateRange.${p === 'last_week' ? 'lastWeek' : p}`) })),
                        { value: rangeOptionValue, label: t('common.schemaTable.dateRange.selectDate') }
                      ]
                    const openDateRangeDialog = () => {
                      setDateRangeDraft((prev) => ({
                        ...prev,
                        [filter.field]: { start: startVal, end: endVal }
                      }))
                      setDateRangePickerOpen(filter.field)
                    }
                    return (
                      <Box key={filter.field} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>{filter.label}</InputLabel>
                          <Select
                            value={dropdownValue}
                            label={filter.label}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v === '') {
                                setFilters({ ...filters, [startField]: '', [endField]: '' })
                                setDateRangeDropdownValue((prev) => ({ ...prev, [filter.field]: '' }))
                                return
                              }
                              if (v === 'today' || v === 'yesterday' || v === 'last_week') {
                                const { start, end } = getPresetRange(v)
                                setFilters({ ...filters, [startField]: start, [endField]: end })
                                setDateRangeDropdownValue((prev) => ({ ...prev, [filter.field]: '' }))
                                return
                              }
                              if (v === rangeOptionValue) {
                                setDateRangeDropdownValue((prev) => ({ ...prev, [filter.field]: v }))
                                openDateRangeDialog()
                              }
                            }}
                            sx={{
                              borderRadius: 1.5,
                              height: '38px',
                              fontSize: '0.875rem',
                              '& .MuiSelect-select': { minWidth: '100px' }
                            }}
                          >
                            {daterangeOptions.map((opt) => (
                              <MenuItem key={String(opt.value)} value={String(opt.value)}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {dropdownValue === rangeOptionValue && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={openDateRangeDialog}
                          >
                            {startVal && endVal
                              ? `${startVal.includes('T') ? formatDateTime(startVal) : formatDate(startVal)} – ${endVal.includes('T') ? formatDateTime(endVal) : formatDate(endVal)}`
                              : `${t('common.schemaTable.dateRange.start')} – ${t('common.schemaTable.dateRange.end')}`}
                          </Button>
                        )}
                        <Dialog
                          open={dateRangePickerOpen === filter.field}
                          onClose={(_e, reason) => {
                            if (reason === 'backdropClick') return
                            setDateRangePickerOpen(null)
                          }}
                          maxWidth="xs"
                        >
                          <FilterDateRangePicker
                            value={dateRangeDraft[filter.field] ?? { start: startVal, end: endVal }}
                            onChange={(v) => {
                              setDateRangeDraft((prev) => ({
                                ...prev,
                                [filter.field]: { start: v.start ?? '', end: v.end ?? '' }
                              }))
                            }}
                            includeTimeSwitch={dr.includeTimeSwitch}
                            defaultTimeEnabled={dr.defaultTimeEnabled}
                            includeTime={dateRangeIncludeTime[filter.field] ?? dr.defaultTimeEnabled}
                            onIncludeTimeChange={(v) =>
                              setDateRangeIncludeTime((prev) => ({ ...prev, [filter.field]: v }))
                            }
                            showActions
                            onApply={() => {
                              const draft = dateRangeDraft[filter.field]
                              if (draft) {
                                setFilters((prev) => ({
                                  ...prev,
                                  [startField]: draft.start ? toDateOnly(draft.start) : '',
                                  [endField]: draft.end ? toDateOnly(draft.end) : ''
                                }))
                              }
                              setDateRangePickerOpen(null)
                            }}
                            onCancel={() => setDateRangePickerOpen(null)}
                          />
                        </Dialog>
                      </Box>
                    )
                  }

                  if (filter.type === 'date' || filter.type === 'datetime') {
                    return (
                      <FormControl key={filter.field} size="small" sx={{ minWidth: 160 }} variant="outlined">
                        <CustomTextField
                          type="date"
                          size="small"
                          label={filter.label}
                          value={filters[filter.field] || ''}
                          onChange={(e) => {
                            const newFilters = { ...filters, [filter.field]: e.target.value }
                            setFilters(newFilters)
                          }}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            borderRadius: 1.5,
                            '& .MuiOutlinedInput-root': { height: '38px', fontSize: '0.875rem' }
                          }}
                        />
                      </FormControl>
                    )
                  }

                  let selectOptions: OptionItemType[] = []
                  if (filter.optionsSource === 'api' || filter.optionsSource === 'cache') {
                    selectOptions = filterOptions[filter.field] || []
                  } else {
                    selectOptions = filter.options || []
                  }

                  const isLoading = filterOptionsLoading[filter.field]

                  return (
                    <FormControl key={filter.field} size="small" sx={{ minWidth: 180, position: 'relative' }}>
                      <InputLabel>{filter.label}</InputLabel>
                      <Select
                        value={filters[filter.field] || ''}
                        label={filter.label}
                        onChange={(e) => {
                          const newFilters = { ...filters, [filter.field]: e.target.value }
                          setFilters(newFilters)
                        }}
                        disabled={isLoading}
                        sx={{
                          borderRadius: 1.5,
                          height: '38px',
                          fontSize: '0.875rem',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider'
                          },
                          '& .MuiSelect-select': {
                            paddingRight: '40px !important',
                            minWidth: '140px'
                          }
                        }}
                      >
                        <MenuItem value="">{t('common.schemaTable.all')}</MenuItem>
                        {selectOptions.map((option) => (
                          <MenuItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {isLoading && (
                        <CircularProgress
                          size={20}
                          sx={{
                            position: 'absolute',
                            right: 30,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </FormControl>
                  )
                })}
              </Box>
            )}

            {/* Global Actions */}
            <Box sx={{ display: 'flex', gap: 2, ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
              {globalActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.type === 'primary' ? 'contained' : 'outlined'}
                  color={action.type === 'danger' ? 'error' : action.type === 'success' ? 'success' : 'primary'}
                  startIcon={action.icon ? <i className={action.icon} style={{ fontSize: '1rem' }} /> : undefined}
                  onClick={() => handleActionClick(action, {} as T)}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 'var(--at-control-radius, 8px)',
                    boxShadow: 'none',
                    height: '38px',
                    fontSize: '0.875rem',
                    ...(action.type === 'primary'
                      ? {
                          backgroundColor: 'var(--at-accent, var(--mui-palette-primary-main))',
                          color: 'var(--at-accent-fg, var(--mui-palette-primary-contrastText))',
                          '&:hover': { backgroundColor: 'var(--at-accent-strong, var(--mui-palette-primary-dark))' }
                        }
                      : {})
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Box>
        </CardContent>

        {/* Table - Full Width with Horizontal Scroll */}
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'visible',
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }}
        >
          <table 
            className={tableStyles.table}
            style={{ 
              width: '100%',
              minWidth: 'max-content', // Ensure table maintains minimum width for all columns
              tableLayout: 'auto' // Allow columns to size based on content
            }}
          >
            <thead>
              <tr>
                <th>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </th>
                {schema.columns.map((column) => {
                  const isNumeric = column.type === 'currency' || column.type === 'number'
                  return (
                  <th
                    key={column.field}
                    className={classnames({
                      'cursor-pointer select-none': column.sortable,
                      'at-num': isNumeric
                    })}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className={classnames({
                      'flex items-center': column.sortable,
                      'justify-end': isNumeric && column.sortable
                    })}>
                      {column.label}
                      {column.sortable && (
                        <i
                          className={
                            sortField === column.field
                              ? sortDirection === 'asc'
                                ? 'tabler-chevron-up text-xl'
                                : 'tabler-chevron-down text-xl'
                              : 'tabler-chevrons-up-down text-xl'
                          }
                          style={{ marginLeft: '0.5rem', opacity: sortField === column.field ? 1 : 0.5 }}
                        />
                      )}
                    </div>
                  </th>
                  )
                })}
                {rowActions.length > 0 && <th align="right">{t('common.schemaTable.actionsColumn')}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={schema.columns.length + 1 + (rowActions.length > 0 ? 1 : 0)} className='text-center'>
                    {t('common.schemaTable.loading')}
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={schema.columns.length + 1 + (rowActions.length > 0 ? 1 : 0)}>
                    <div className='at-empty'>
                      <i className='tabler-inbox' aria-hidden='true' />
                      {t('common.schemaTable.noData')}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const handleRowClick = () => {
                    if (onRowClick) {
                      onRowClick(item)
                    }
                  }

                  return (
                    <tr
                      key={item.id}
                      className={classnames({
                        'cursor-pointer': onRowClick
                      })}
                      onClick={handleRowClick}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={allMatchingSelected || selectedRows.has(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      {schema.columns.map((column, columnIndex) => {
                        const value = column.field === 'dimensions' && !getNestedValue(item, column.field)
                          ? (item as any).length && (item as any).width && (item as any).height
                            ? `${(item as any).length} × ${(item as any).width} × ${(item as any).height} cm`
                            : '-'
                          : getNestedValue(item, column.field)

                        // Check if column has a link action
                        const hasLink = !!column.link
                        const isNumeric = column.type === 'currency' || column.type === 'number'
                        const handleColumnClick = (e: React.MouseEvent) => {
                          if (hasLink && column.link) {
                            e.stopPropagation()
                            // Find the action by ID and trigger it through executeAction
                            const action = schema.actions?.find(a => a.id === column.link)
                            if (action) {
                              executeAction(action, item)
                            }
                          }
                        }

                        return (
                          <td
                            key={column.field}
                            className={classnames({ 'hover:underline': hasLink, 'at-num': isNumeric })}
                            onClick={hasLink ? handleColumnClick : undefined}
                            style={hasLink ? { 
                              color: 'var(--mui-palette-primary-main)', 
                              cursor: 'pointer' 
                            } : undefined}
                          >
                            {column.render
                              ? column.render(value, item)
                              : formatValue(value, column.type)}
                          </td>
                        )
                      })}
                      {rowActions.length > 0 && (
                        <td align="right" onClick={(e) => e.stopPropagation()}>
                          {rowActions.some(a => !a.hidden?.(item)) && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionMenuAnchor({ el: e.currentTarget, item })
                              }}
                            >
                              <i className="tabler-dots-vertical" />
                            </IconButton>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Box>

        {/* Pagination */}
        <CardContent sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2,
          py: 2,
          px: 3,
          borderTop: '1px solid',
          borderColor: 'var(--at-divider, var(--mui-palette-divider))'
        }}>
          {/* Left: Showing info + Items per page */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography color='text.secondary' variant='body2' sx={{ fontSize: '0.875rem', minWidth: 'fit-content' }}>
              {t('common.schemaTable.showing')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{startIndex}</Box> {t('common.schemaTable.to')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{endIndex}</Box> {t('common.schemaTable.of')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{displayTotal}</Box> {t('common.schemaTable.entries')}
            </Typography>
          </Box>

          {/* Right: Items per page + Pagination */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography color='text.secondary' variant='body2' sx={{ fontSize: '0.875rem' }}>
                {t('common.schemaTable.itemsPerPage')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                  value={displayRowsPerPage}
                  onChange={e => {
                    const n = Number(e.target.value)
                    if (_sp) { _sp.onRowsPerPageChange(n); _sp.onPageChange(0) }
                    else { setRowsPerPage(n); setPage(0) }
                  }}
                  displayEmpty
                  sx={{ fontSize: '0.875rem', height: '38px' }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Pagination
              shape='rounded'
              color='primary'
              variant='outlined'
              count={totalPages}
              page={displayPage + 1}
              onChange={(_, newPage) => _sp ? _sp.onPageChange(newPage - 1) : setPage(newPage - 1)}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  minWidth: 36,
                  height: 36,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: 'var(--at-control-radius, 8px)',
                  borderColor: 'var(--at-card-border, var(--mui-palette-divider))'
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  backgroundColor: 'var(--at-accent, var(--mui-palette-primary-main))',
                  color: 'var(--at-accent-fg, var(--mui-palette-primary-contrastText))',
                  borderColor: 'transparent',
                  '&:hover': { backgroundColor: 'var(--at-accent-strong, var(--mui-palette-primary-dark))' }
                },
                '& .MuiPaginationItem-icon': {
                  fontSize: '1.25rem'
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor?.el}
        open={!!actionMenuAnchor}
        onClose={() => setActionMenuAnchor(null)}
      >
        {rowActions
          .filter(action => !(actionMenuAnchor && action.hidden?.(actionMenuAnchor.item)))
          .map((action) => (
            <MenuItem
              key={action.id}
              onClick={() => {
                if (actionMenuAnchor) {
                  handleActionClick(action, actionMenuAnchor.item)
                }
              }}
            >
              {action.label}
            </MenuItem>
          ))}
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionMenuAnchor}
        open={!!bulkActionMenuAnchor}
        onClose={() => setBulkActionMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        sx={{
          '& .MuiPaper-root': {
            mt: 1
          }
        }}
      >
        <MenuItem onClick={() => {
          setBulkActionMenuAnchor(null)
          setBulkDeleteConfirm(true)
        }}>
          {t('common.schemaTable.deleteSelected')}
        </MenuItem>
        <MenuItem onClick={() => {
          setBulkActionMenuAnchor(null)
        }}>
          {t('common.schemaTable.exportSelected')}
        </MenuItem>
      </Menu>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>{t('common.schemaTable.confirmAction')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog?.action.confirm || t('common.schemaTable.confirmMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>{t('common.actions.cancel')}</Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained">
            {t('common.schemaTable.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)}>
        <DialogTitle>{t('common.schemaTable.confirmAction')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('common.schemaTable.confirmBulkDelete', { count: selectedRows.size })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirm(false)}>{t('common.actions.cancel')}</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            {t('common.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

