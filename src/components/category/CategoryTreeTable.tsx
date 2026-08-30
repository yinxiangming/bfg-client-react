'use client'

// React Imports
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'

// The shared label-above field. Raw MUI TextField/Select render outlined at
// medium size — 56px against the 38px every other admin toolbar uses.
import CustomTextField from '@/components/ui/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Type Imports
import type { Category } from '@/services/store'
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

type CategoryTreeTableProps = {
  categories: Category[]
  onActionClick?: (action: SchemaAction, item: Category) => void
  basePath?: string
  lang: string
  /** Persist a category's visibility. Omit to render the switch read-only. */
  onToggleActive?: (item: Category, isActive: boolean) => Promise<void> | void
  /** Persist new `order` values. Only the rows whose order actually moved are sent. */
  onReorder?: (changes: Array<{ id: number; order: number }>) => Promise<void> | void
}

type CategoryNode = Omit<Category, 'children'> & {
  children?: CategoryNode[]
  level: number
  expanded?: boolean
  path?: number[] // Path from root to this node (e.g., [1, 2, 3])
}


export default function CategoryTreeTable({
  categories,
  onActionClick,
  basePath,
  lang,
  onToggleActive,
  onReorder
}: CategoryTreeTableProps) {
  const router = useRouter()
  const { confirm } = useAppDialog()
  const t = useTranslations('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  // Flip the switch straight away and let the reload confirm it; a round trip
  // to the API is long enough that an unmoved switch reads as a dead control.
  const [pendingActive, setPendingActive] = useState<Record<number, boolean>>({})

  // The reload has landed, so the rows carry the truth again.
  useEffect(() => {
    setPendingActive({})
  }, [categories])

  // Default expand all on mount
  useEffect(() => {
    const allIds = new Set(categories.map(cat => cat.id))
    setExpandedIds(allIds)
  }, [categories])

  // Build tree structure with paths
  const treeData = useMemo(() => {
    const categoryMap = new Map<number, CategoryNode>()
    const rootCategories: CategoryNode[] = []

    // First pass: create map and add all categories
    categories.forEach(cat => {
      // Ensure children are not carried over from API type (Category[])
      const { children: _children, ...rest } = cat as any
      categoryMap.set(cat.id, { ...rest, level: 0, path: [] })
    })

    // Second pass: build tree
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!
      if (cat.parent && categoryMap.has(cat.parent)) {
        const parent = categoryMap.get(cat.parent)!
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
        node.level = parent.level + 1
      } else {
        rootCategories.push(node)
      }
    })

    // Sort categories by order, then by name, and assign path indices
    const sortCategories = (cats: CategoryNode[], parentPath: number[] = []): CategoryNode[] => {
      return cats.sort((a, b) => {
        const orderA = a.order || 100
        const orderB = b.order || 100
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return (a.name || '').localeCompare(b.name || '')
      }).map((cat, index) => {
        const currentPath = [...parentPath, index + 1]
        if (cat.children && cat.children.length > 0) {
          return { ...cat, children: sortCategories(cat.children, currentPath), path: currentPath }
        }
        return { ...cat, path: currentPath }
      })
    }

    return { rootCategories: sortCategories(rootCategories, []), categoryMap }
  }, [categories])

  // Filter categories
  const filteredCategories = useMemo(() => {
    let filtered = categories

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cat => 
        cat.name?.toLowerCase().includes(query) ||
        cat.slug?.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
      )
    }

    // Filter by active status
    if (activeFilter !== '') {
      const isActive = activeFilter === 'true'
      filtered = filtered.filter(cat => cat.is_active === isActive)
    }

    return filtered
  }, [categories, searchQuery, activeFilter])

  // Rebuild tree with filtered categories
  const filteredTreeData = useMemo(() => {
    if (!searchQuery.trim() && activeFilter === '') {
      return treeData
    }

    // Rebuild tree with filtered categories
    const categoryMap = new Map<number, CategoryNode>()
    const rootCategories: CategoryNode[] = []

    filteredCategories.forEach(cat => {
      const { children: _children, ...rest } = cat as any
      categoryMap.set(cat.id, { ...rest, level: 0, path: [] })
    })

    filteredCategories.forEach(cat => {
      const node = categoryMap.get(cat.id)!
      if (cat.parent && categoryMap.has(cat.parent)) {
        const parent = categoryMap.get(cat.parent)!
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
        node.level = parent.level + 1
      } else {
        rootCategories.push(node)
      }
    })

    // Sort and assign paths
    const sortCategories = (cats: CategoryNode[], parentPath: number[] = []): CategoryNode[] => {
      return cats.sort((a, b) => {
        const orderA = a.order || 100
        const orderB = b.order || 100
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return (a.name || '').localeCompare(b.name || '')
      }).map((cat, index) => {
        const currentPath = [...parentPath, index + 1]
        if (cat.children && cat.children.length > 0) {
          return { ...cat, children: sortCategories(cat.children, currentPath), path: currentPath }
        }
        return { ...cat, path: currentPath }
      })
    }

    return { rootCategories: sortCategories(rootCategories, []), categoryMap }
  }, [filteredCategories, searchQuery, activeFilter, treeData])

  // Flatten tree for display
  const flattenTree = (nodes: CategoryNode[], level: number = 0, parentPath: string = ''): Array<CategoryNode & { uniqueKey: string }> => {
    const result: Array<CategoryNode & { uniqueKey: string }> = []
    nodes.forEach((node, index) => {
      const hasChildren = node.children && node.children.length > 0
      const isExpanded = expandedIds.has(node.id)
      
      // Create unique key using path to ensure uniqueness even if same category appears in different branches
      const currentPath = parentPath ? `${parentPath}-${index}` : `${index}`
      const uniqueKey = `category-${node.id}-${currentPath}`
      
      result.push({ ...node, level, expanded: isExpanded, uniqueKey })
      
      if (hasChildren && isExpanded) {
        result.push(...flattenTree(node.children!, level + 1, currentPath))
      }
    })
    return result
  }

  const displayRows = flattenTree(filteredTreeData.rootCategories)

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Reordering happens within a sibling group, and against the unfiltered tree:
  // a hidden neighbour is still a neighbour, so a filtered view would move a row
  // past rows the user cannot see. The buttons are disabled while a filter is on.
  const siblingGroups = useMemo(() => {
    const groups = new Map<number, CategoryNode[]>()
    const walk = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        groups.set(node.id, nodes)
        if (node.children && node.children.length > 0) walk(node.children)
      })
    }
    walk(treeData.rootCategories)
    return groups
  }, [treeData])

  const isFiltered = searchQuery.trim() !== '' || activeFilter !== ''

  const withBusy = async (ids: number[], run: () => Promise<void> | void) => {
    setBusyIds(prev => new Set([...prev, ...ids]))
    try {
      await run()
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  const handleToggleActive = async (item: CategoryNode, isActive: boolean) => {
    if (!onToggleActive) return
    setPendingActive(prev => ({ ...prev, [item.id]: isActive }))
    await withBusy([item.id], async () => {
      try {
        await onToggleActive(item as Category, isActive)
      } catch {
        // The reload the page runs on failure restores the real state; drop the
        // guess now so the switch does not sit on a value that never saved.
        setPendingActive(prev => {
          const next = { ...prev }
          delete next[item.id]
          return next
        })
      }
    })
  }

  const handleMove = async (item: CategoryNode, delta: -1 | 1) => {
    if (!onReorder) return
    const siblings = siblingGroups.get(item.id)
    if (!siblings) return
    const from = siblings.findIndex(sibling => sibling.id === item.id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= siblings.length) return

    const moved = [...siblings]
    moved.splice(to, 0, ...moved.splice(from, 1))

    // Renumber the whole group rather than swapping two values: an imported
    // tree tends to share one default order across every sibling, and swapping
    // equal numbers moves nothing. Only rows that actually change are sent.
    const changes = moved
      .map((cat, index) => ({ id: cat.id, order: index + 1, previous: cat.order }))
      .filter(change => change.order !== change.previous)
      .map(({ id, order }) => ({ id, order }))

    if (changes.length === 0) return
    await withBusy(changes.map(change => change.id), () => onReorder(changes))
  }

  const handleRowClick = (item: Category) => {
    if (basePath) {
      router.push(`${basePath}/${item.id}/edit`)
    }
  }

  const handleProductsClick = (e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation()
    router.push(`/admin/store/products?category=${categoryId}`)
  }

  const getOrderPath = (node: CategoryNode): string => {
    if (node.path && node.path.length > 0) {
      return node.path.join('-')
    }
    // Fallback: calculate from level and order
    return String(node.order || '')
  }

  const formatValue = (value: any, type?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    switch (type) {
      case 'datetime':
        if (typeof value === 'string') {
          return new Date(value).toLocaleString()
        }
        return String(value)
      case 'boolean':
        return value ? t('categories.values.yes') : t('categories.values.no')
      default:
        return String(value)
    }
  }

  return (
    <Card>
      {/* Filter row — inside the table's card, so the list reads as one
          surface the way every other admin list does. */}
      <CardContent sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomTextField
              fullWidth
              placeholder={t('categories.treeTable.filters.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <i className='tabler-search' style={{ marginRight: 8, opacity: 0.6 }} />
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomTextField
              select
              fullWidth
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              slotProps={{
                select: {
                  // Unset, a filled select renders blank — no label sits above it
                  // here because the search box beside it has none either. Show
                  // the filter's name as the resting state instead, the way the
                  // SchemaTable toolbars do.
                  displayEmpty: true,
                  renderValue: (value: unknown) =>
                    value === ''
                      ? (
                        <Box component='span' sx={{ color: 'text.disabled' }}>
                          {t('categories.treeTable.filters.activeStatus.label')}
                        </Box>
                      )
                      : t(
                        value === 'true'
                          ? 'categories.treeTable.filters.activeStatus.active'
                          : 'categories.treeTable.filters.activeStatus.inactive'
                      )
                }
              }}
            >
              <MenuItem value=''>{t('categories.treeTable.filters.activeStatus.all')}</MenuItem>
              <MenuItem value='true'>{t('categories.treeTable.filters.activeStatus.active')}</MenuItem>
              <MenuItem value='false'>{t('categories.treeTable.filters.activeStatus.inactive')}</MenuItem>
            </CustomTextField>
          </Grid>
        </Grid>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '35%' }}>{t('categories.treeTable.table.headers.name')}</TableCell>
              <TableCell>{t('categories.treeTable.table.headers.slug')}</TableCell>
              <TableCell>{t('categories.treeTable.table.headers.language')}</TableCell>
              <TableCell align="right">{t('categories.treeTable.table.headers.order')}</TableCell>
              <TableCell align="center">{t('categories.treeTable.table.headers.active')}</TableCell>
              <TableCell align="right">{t('categories.treeTable.table.headers.products')}</TableCell>
              <TableCell align="center">{t('categories.treeTable.table.headers.actions')}</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
          {displayRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  {t('categories.treeTable.table.empty')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            displayRows.map(item => {
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedIds.has(item.id)
              const indent = item.level * 24
              const isActive = pendingActive[item.id] ?? item.is_active
              const isBusy = busyIds.has(item.id)
              const siblings = siblingGroups.get(item.id)
              const position = siblings ? siblings.findIndex(sibling => sibling.id === item.id) : -1
              const canMoveUp = !!onReorder && !isFiltered && position > 0
              const canMoveDown = !!onReorder && !isFiltered && position >= 0 && position < (siblings?.length ?? 0) - 1

              return (
                <TableRow
                  key={item.uniqueKey}
                  hover
                  sx={{ cursor: basePath ? 'pointer' : 'default' }}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
                      {hasChildren && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(item.id)
                          }}
                          sx={{ mr: 1 }}
                        >
                          <i className={isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right'} />
                        </IconButton>
                      )}
                      {!hasChildren && <Box sx={{ width: 32 }} />}
                      {item.icon && (
                        <i className={item.icon} style={{ marginRight: 8, fontSize: '1.2rem' }} />
                      )}
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatValue(item.slug)}</TableCell>
                  <TableCell>{formatValue(item.language)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {getOrderPath(item)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={e => e.stopPropagation()}>
                    <Tooltip title={t('categories.treeTable.tooltips.toggleActive')}>
                      {/* A disabled control swallows the events Tooltip listens for. */}
                      <span>
                        <Switch
                          size="small"
                          checked={isActive}
                          disabled={!onToggleActive || isBusy}
                          onChange={e => handleToggleActive(item, e.target.checked)}
                          inputProps={{
                            'aria-label': t('categories.treeTable.tooltips.toggleActive')
                          }}
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell 
                    align="right"
                    onClick={(e) => handleProductsClick(e, item.id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Tooltip title={t('categories.treeTable.tooltips.viewProducts')}>
                      <Typography variant="body2" color="primary">
                        {formatValue(item.product_count || 0)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {onReorder && (
                        <>
                          <Tooltip
                            title={isFiltered ? t('categories.treeTable.actions.reorderFiltered') : t('categories.treeTable.actions.moveUp')}
                          >
                            {/* A disabled control swallows the events Tooltip listens for. */}
                            <span>
                              <IconButton
                                size="small"
                                disabled={!canMoveUp || isBusy}
                                onClick={() => handleMove(item, -1)}
                              >
                                <i className="tabler-arrow-up" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={isFiltered ? t('categories.treeTable.actions.reorderFiltered') : t('categories.treeTable.actions.moveDown')}
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={!canMoveDown || isBusy}
                                onClick={() => handleMove(item, 1)}
                              >
                                <i className="tabler-arrow-down" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                      {basePath && (
                        <>
                          <Tooltip title={t('categories.treeTable.actions.addSubcategory')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => router.push(`${basePath}/new?parent=${item.id}`)}
                            >
                              <i className="tabler-plus" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('categories.treeTable.actions.edit')}>
                            <IconButton
                              size="small"
                              onClick={() => router.push(`${basePath}/${item.id}/edit`)}
                            >
                              <i className="tabler-edit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('categories.treeTable.actions.delete')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (await confirm(t('categories.treeTable.actions.confirmDeleteWithName', { name: item.name }), { danger: true })) {
                                  onActionClick?.(
                                    { id: 'delete', label: t('categories.treeTable.actions.delete'), type: 'danger', scope: 'row' },
                                    item
                                  )
                                }
                              }}
                            >
                              <i className="tabler-trash" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
    </Card>
  )
}

