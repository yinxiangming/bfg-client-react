'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { useAppDialog } from '@/contexts/AppDialogContext'
import CategoryEditDialog from './CategoryEditDialog'
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CategoryPayload
} from '@/services/web'

type CategoryNode = Category & {
  level: number
  children?: CategoryNode[]
  expanded?: boolean
}

const CategoriesTab = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const { data, loading, error, refetch } = useApiData<Category[]>({
    fetchFn: async () => {
      const result = await getCategories()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // Default expand all on mount
  useEffect(() => {
    if (data && data.length > 0) {
      const allIds = new Set(data.map(cat => cat.id))
      setExpandedIds(allIds)
    }
  }, [data])

  // Build tree structure
  const treeData = useMemo(() => {
    if (!data || data.length === 0) return { rootCategories: [], categoryMap: new Map() }

    const categoryMap = new Map<number, CategoryNode>()
    const rootCategories: CategoryNode[] = []

    // First pass: create map and add all categories
    data.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, level: 0 })
    })

    // Second pass: build tree
    data.forEach(cat => {
      const node = categoryMap.get(cat.id)!
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
        node.level = parent.level + 1
      } else {
        rootCategories.push(node)
      }
    })

    // Sort categories by order, then by name
    const sortCategories = (cats: CategoryNode[]): CategoryNode[] => {
      return cats.sort((a, b) => {
        const orderA = a.order || 100
        const orderB = b.order || 100
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return (a.name || '').localeCompare(b.name || '')
      }).map(cat => {
        if (cat.children && cat.children.length > 0) {
          return { ...cat, children: sortCategories(cat.children) }
        }
        return cat
      })
    }

    return { rootCategories: sortCategories(rootCategories), categoryMap }
  }, [data])

  // Flatten tree for display
  const flattenTree = (nodes: CategoryNode[], level: number = 0): CategoryNode[] => {
    const result: CategoryNode[] = []
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0
      const isExpanded = expandedIds.has(node.id)
      
      result.push({ ...node, level, expanded: isExpanded })
      
      if (hasChildren && isExpanded) {
        result.push(...flattenTree(node.children!, level + 1))
      }
    })
    return result
  }

  const displayRows = flattenTree(treeData.rootCategories)

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

  const handleActionClick = async (action: SchemaAction, item: Category | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Category)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCategory((item as Category).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.categories.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CategoryPayload) => {
    try {
      if (selected) {
        await updateCategory(selected.id, payload)
      } else {
        await createCategory(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.categories.tab.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() =>
            handleActionClick(
              { id: 'add', label: t('settings.web.categories.tab.actions.newCategory'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
              {}
            )
          }
        >
          {t('settings.web.categories.tab.actions.newCategory')}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%' }}>{t('settings.web.categories.tab.headers.name')}</TableCell>
              <TableCell>{t('settings.web.categories.tab.headers.slug')}</TableCell>
              <TableCell>{t('settings.web.categories.tab.headers.contentType')}</TableCell>
              <TableCell>{t('settings.web.categories.tab.headers.language')}</TableCell>
              <TableCell align='right'>{t('settings.web.categories.tab.headers.order')}</TableCell>
              <TableCell align='center'>{t('settings.web.categories.tab.headers.status')}</TableCell>
              <TableCell align='center'>{t('settings.web.categories.tab.headers.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    {t('settings.web.categories.tab.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map(item => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedIds.has(item.id)
                const indent = item.level * 24

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
                        {hasChildren && (
                          <IconButton
                            size='small'
                            onClick={() => toggleExpand(item.id)}
                            sx={{ mr: 1 }}
                          >
                            <i className={isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right'} />
                          </IconButton>
                        )}
                        {!hasChildren && <Box sx={{ width: 32 }} />}
                        {item.icon && (
                          <i className={item.icon} style={{ marginRight: 8, fontSize: '1.2rem' }} />
                        )}
                        {item.color && (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: item.color,
                              mr: 1,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                        )}
                        <Typography 
                          variant='body2'
                          className='cursor-pointer hover:text-primary'
                          onClick={() =>
                            handleActionClick(
                              { id: 'edit', label: t('settings.web.categories.tab.actions.edit'), type: 'secondary', scope: 'row' },
                              item
                            )
                          }
                          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {item.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.content_type_name ? (
                        <Chip label={item.content_type_name} size='small' variant='outlined' />
                      ) : (
                        <Typography variant='body2' color='text.secondary'>-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{item.language}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                        {item.order || 100}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          item.is_active
                            ? t('settings.web.categories.tab.status.active')
                            : t('settings.web.categories.tab.status.inactive')
                        }
                        color={item.is_active ? 'success' : 'default'}
                        size='small'
                      />
                    </TableCell>
                    <TableCell align='center'>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title={t('settings.web.categories.tab.actions.edit')}>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleActionClick(
                                { id: 'edit', label: t('settings.web.categories.tab.actions.edit'), type: 'secondary', scope: 'row' },
                                item
                              )
                            }
                          >
                            <i className='tabler-edit' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('settings.web.categories.tab.actions.delete')}>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={async () => {
                              if (await confirm(t('settings.web.categories.tab.confirmDeleteWithName', { name: item.name }), { danger: true })) {
                                handleActionClick(
                                  { id: 'delete', label: t('settings.web.categories.tab.actions.delete'), type: 'danger', scope: 'row' },
                                  item
                                )
                              }
                            }}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CategoryEditDialog
        open={editOpen}
        category={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default CategoriesTab
