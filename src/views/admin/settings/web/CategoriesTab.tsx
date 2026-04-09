'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { useAppDialog } from '@/contexts/AppDialogContext'
import CustomTextField from '@/components/ui/TextField'
import CategoryEditDialog from './CategoryEditDialog'
import CategoryFieldsSchemaDialog from './CategoryFieldsSchemaDialog'
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CategoryFieldsSchema,
  type CategoryPayload
} from '@/services/web'

import tableStyles from '@/styles/table.module.css'

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
  const [schemaOpen, setSchemaOpen] = useState(false)
  const [schemaCategory, setSchemaCategory] = useState<Category | null>(null)
  const [schemaLoadingId, setSchemaLoadingId] = useState<number | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

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

    data.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, level: 0 })
    })

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

  const visibleIds = useMemo((): Set<number> | null => {
    if (!data?.length) return null
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return null

    const byId = new Map(data.map(c => [c.id, c]))
    const matchIds: number[] = []
    for (const c of data) {
      const name = (c.name || '').toLowerCase()
      const slug = (c.slug || '').toLowerCase()
      if (name.includes(q) || slug.includes(q)) matchIds.push(c.id)
    }
    if (matchIds.length === 0) return new Set<number>()

    const visible = new Set<number>()
    const addAncestors = (id: number) => {
      let cur: Category | undefined = byId.get(id)
      while (cur) {
        visible.add(cur.id)
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
      }
    }
    const addDescendants = (id: number) => {
      for (const c of data) {
        if (c.parent_id === id) {
          visible.add(c.id)
          addDescendants(c.id)
        }
      }
    }
    for (const id of matchIds) {
      visible.add(id)
      addAncestors(id)
      addDescendants(id)
    }
    return visible
  }, [data, debouncedSearch])

  const displayRows = useMemo(() => {
    const flattenTree = (nodes: CategoryNode[], level: number = 0): CategoryNode[] => {
      const result: CategoryNode[] = []
      const filtering = visibleIds !== null
      nodes.forEach(node => {
        if (filtering && !visibleIds!.has(node.id)) return
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = filtering ? true : expandedIds.has(node.id)
        const isExpandedState = expandedIds.has(node.id)
        result.push({ ...node, level, expanded: filtering ? true : isExpandedState })
        if (hasChildren && isExpanded) {
          result.push(...flattenTree(node.children!, level + 1))
        }
      })
      return result
    }
    return flattenTree(treeData.rootCategories)
  }, [treeData, expandedIds, visibleIds])

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
        await createCategory({ ...payload, fields_schema: payload.fields_schema ?? {} })
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.categories.tab.errors.saveFailed', { error: err.message }))
    }
  }

  const openSchemaDialog = async (item: Category) => {
    setSchemaLoadingId(item.id)
    try {
      const fresh = await getCategory(item.id)
      setSchemaCategory(fresh)
      setSchemaOpen(true)
    } catch (err: any) {
      alert(t('settings.web.categories.tab.errors.saveFailed', { error: err.message }))
    } finally {
      setSchemaLoadingId(null)
    }
  }

  const handleSaveFieldsSchema = async (fields_schema: CategoryFieldsSchema) => {
    if (!schemaCategory) return
    await updateCategory(schemaCategory.id, { fields_schema })
    await refetch()
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

  const emptyMessage =
    displayRows.length === 0 && debouncedSearch.trim() && (data?.length ?? 0) > 0
      ? t('common.schemaTable.noData')
      : t('settings.web.categories.tab.empty')

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
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ py: 2, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <CustomTextField
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('common.schemaTable.searchPlaceholder')}
              size='small'
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
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                ml: { xs: 0, sm: 'auto' },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-end', sm: 'flex-start' }
              }}
            >
              <Button
                variant='contained'
                color='primary'
                size='small'
                startIcon={<i className='tabler-plus' style={{ fontSize: '1rem' }} />}
                onClick={() =>
                  handleActionClick(
                    {
                      id: 'add',
                      label: t('settings.web.categories.tab.actions.newCategory'),
                      type: 'primary',
                      scope: 'global',
                      icon: 'tabler-plus'
                    },
                    {}
                  )
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  height: '38px',
                  fontSize: '0.875rem'
                }}
              >
                {t('settings.web.categories.tab.actions.newCategory')}
              </Button>
            </Box>
          </Box>
        </CardContent>

        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            overflowY: 'visible',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': { background: 'rgba(0, 0, 0, 0.3)' }
            }
          }}
        >
          <table
            className={tableStyles.table}
            style={{
              width: '100%',
              minWidth: 'max-content',
              tableLayout: 'auto'
            }}
          >
            <thead>
              <tr>
                <th>{t('settings.web.categories.tab.headers.name')}</th>
                <th>{t('settings.web.categories.tab.headers.slug')}</th>
                <th>{t('settings.web.categories.tab.headers.contentType')}</th>
                <th>{t('settings.web.categories.tab.headers.language')}</th>
                <th align='right'>{t('settings.web.categories.tab.headers.order')}</th>
                <th align='center'>{t('settings.web.categories.tab.headers.status')}</th>
                <th align='center'>{t('settings.web.categories.tab.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={7} align='center'>
                    <Typography variant='body2' color='text.secondary'>
                      {emptyMessage}
                    </Typography>
                  </td>
                </tr>
              ) : (
                displayRows.map(item => {
                  const hasChildren = item.children && item.children.length > 0
                  const isExpanded = expandedIds.has(item.id)
                  const indent = item.level * 24
                  const filtering = visibleIds !== null

                  return (
                    <tr key={item.id}>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center', pl: `${indent}px` }}>
                          {hasChildren && !filtering ? (
                            <IconButton size='small' onClick={() => toggleExpand(item.id)} sx={{ mr: 1 }}>
                              <i className={isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right'} />
                            </IconButton>
                          ) : (
                            <Box sx={{ width: 32, flexShrink: 0, mr: 1 }} />
                          )}
                          {item.icon && <i className={item.icon} style={{ marginRight: 8, fontSize: '1.2rem' }} />}
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
                                {
                                  id: 'edit',
                                  label: t('settings.web.categories.tab.actions.edit'),
                                  type: 'secondary',
                                  scope: 'row'
                                },
                                item
                              )
                            }
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        <Typography variant='body2' color='text.secondary'>
                          {item.slug}
                        </Typography>
                      </td>
                      <td>
                        {item.content_type_name ? (
                          <Chip label={item.content_type_name} size='small' variant='outlined' />
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            -
                          </Typography>
                        )}
                      </td>
                      <td>
                        <Typography variant='body2'>{item.language}</Typography>
                      </td>
                      <td align='right'>
                        <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                          {item.order || 100}
                        </Typography>
                      </td>
                      <td align='center'>
                        <Chip
                          label={
                            item.is_active
                              ? t('settings.web.categories.tab.status.active')
                              : t('settings.web.categories.tab.status.inactive')
                          }
                          color={item.is_active ? 'success' : 'default'}
                          size='small'
                        />
                      </td>
                      <td align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title={t('settings.web.categories.tab.actions.edit')}>
                            <IconButton
                              size='small'
                              onClick={() =>
                                handleActionClick(
                                  {
                                    id: 'edit',
                                    label: t('settings.web.categories.tab.actions.edit'),
                                    type: 'secondary',
                                    scope: 'row'
                                  },
                                  item
                                )
                              }
                            >
                              <i className='tabler-edit' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('settings.web.categories.tab.actions.editSchema')}>
                            <span>
                              <IconButton
                                size='small'
                                onClick={() => openSchemaDialog(item)}
                                disabled={schemaLoadingId === item.id}
                              >
                                {schemaLoadingId === item.id ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <i className='tabler-template' />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={t('settings.web.categories.tab.actions.delete')}>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={async () => {
                                if (
                                  await confirm(
                                    t('settings.web.categories.tab.confirmDeleteWithName', { name: item.name }),
                                    { danger: true }
                                  )
                                ) {
                                  handleActionClick(
                                    {
                                      id: 'delete',
                                      label: t('settings.web.categories.tab.actions.delete'),
                                      type: 'danger',
                                      scope: 'row'
                                    },
                                    item
                                  )
                                }
                              }}
                            >
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </Box>
      </Card>
      <CategoryEditDialog
        open={editOpen}
        category={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
      <CategoryFieldsSchemaDialog
        open={schemaOpen}
        category={schemaCategory}
        onClose={() => {
          setSchemaOpen(false)
          setSchemaCategory(null)
        }}
        onSave={handleSaveFieldsSchema}
      />
    </>
  )
}

export default CategoriesTab
