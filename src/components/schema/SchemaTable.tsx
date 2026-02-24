'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
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

// Type Imports
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'

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
  customFilters
}: SchemaTableProps<T>) {
  const t = useTranslations('admin')
  // State
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ el: HTMLElement; item: T } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: SchemaAction; item: T } | null>(null)
  const [filterOptions, setFilterOptions] = useState<Record<string, OptionItemType[]>>({})
  const [filterOptionsLoading, setFilterOptionsLoading] = useState<Record<string, boolean>>({})
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set())
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState<HTMLElement | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<boolean>(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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
              const options = await fetchOptionsFromApi(filter.optionsApi)
              setFilterOptions(prev => ({ ...prev, [filter.field]: options }))
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

    // Apply filters (only for local filter mode)
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
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
    const start = page * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

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
            <Chip
              label={value ? t('common.states.active', { defaultValue: 'Active' }) : t('common.states.inactive', { defaultValue: 'Inactive' })}
              size="small"
              color={value ? 'success' : 'default'}
              variant="filled"
              sx={{ 
                height: 24, 
                fontSize: '0.8125rem', 
                fontWeight: 500,
                '& .MuiChip-label': { px: 1.5 }
              }}
            />
          )
        }
        // Handle array values (like warehouses)
        if (Array.isArray(value)) {
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {value.map((item, idx) => (
                <Chip 
                  key={idx} 
                  label={item} 
                  size="small" 
                  variant="filled"
                  sx={{ 
                    height: 24, 
                    fontSize: '0.8125rem', 
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }}
                />
              ))}
            </Box>
          )
        }
        return (
          <Chip
            label={value}
            size="small"
            color={statusColors[value] || 'default'}
            variant="filled"
            sx={{ 
              height: 24, 
              fontSize: '0.8125rem', 
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        )
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

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = filteredData.length === 0 ? 0 : page * rowsPerPage + 1
  const endIndex = Math.min((page + 1) * rowsPerPage, filteredData.length)

  // Row selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(paginatedData.map(item => item.id))
      setSelectedRows(newSelected)
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: number | string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedRows.has(item.id))
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < paginatedData.length

  return (
    <>
      <Card 
        elevation={0} 
        sx={{ 
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Prevent card from overflowing
        }}
      >

        {/* Toolbar with Search, Filters, and Actions */}
        <CardContent sx={{ py: 2, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
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
                          if (filter.filterMode === 'api') {
                            console.log(`Server-side filter for ${filter.field}:`, e.target.value)
                          }
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
                    borderRadius: 1.5,
                    boxShadow: action.type === 'primary' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
                    height: '38px',
                    fontSize: '0.875rem'
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
                {schema.columns.map((column) => (
                  <th
                    key={column.field}
                    className={classnames({
                      'cursor-pointer select-none': column.sortable
                    })}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className={classnames({
                      'flex items-center': column.sortable
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
                ))}
                {rowActions.length > 0 && <th align="right">Actions</th>}
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
                  <td colSpan={schema.columns.length + 1 + (rowActions.length > 0 ? 1 : 0)} className='text-center'>
                    {t('common.schemaTable.noData')}
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
                          checked={selectedRows.has(item.id)}
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
                            className={hasLink ? 'hover:underline' : ''}
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
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionMenuAnchor({ el: e.currentTarget, item })
                            }}
                          >
                            <i className="tabler-dots-vertical" />
                          </IconButton>
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
          borderColor: 'divider'
        }}>
          {/* Left: Showing info + Items per page */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography color='text.secondary' variant='body2' sx={{ fontSize: '0.875rem', minWidth: 'fit-content' }}>
              {t('common.schemaTable.showing')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{startIndex}</Box> {t('common.schemaTable.to')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{endIndex}</Box> {t('common.schemaTable.of')} <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>{filteredData.length}</Box> {t('common.schemaTable.entries')}
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
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value))
                    setPage(0)
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
              page={page + 1}
              onChange={(_, newPage) => setPage(newPage - 1)}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  minWidth: 40,
                  height: 40,
                  fontSize: '0.875rem',
                  fontWeight: 500
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
        {rowActions.map((action) => (
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

