'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import MenuEditDialog from './MenuEditDialog'
import {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  type Menu,
  type MenuPayload
} from '@/services/web'

const buildMenusSchema = (t: any): ListSchema => ({
  title: t('settings.web.menus.tab.title'),
  columns: [
    { field: 'name', label: t('settings.web.menus.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'slug', label: t('settings.web.menus.tab.columns.slug'), type: 'string', sortable: true },
    { field: 'location', label: t('settings.web.menus.tab.columns.location'), type: 'string', sortable: true },
    { field: 'language', label: t('settings.web.menus.tab.columns.language'), type: 'string' },
    { field: 'items_count', label: t('settings.web.menus.tab.columns.itemsCount'), type: 'number' },
    { field: 'is_active', label: t('settings.web.menus.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'slug'],
  actions: [
    { id: 'add', label: t('settings.web.menus.tab.actions.newMenu'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.menus.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.menus.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.menus.tab.actions.confirmDelete')
    }
  ]
})

const MenusTab = () => {
  const t = useTranslations('admin')
  const menusSchema = useMemo(() => buildMenusSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Menu[]>({
    fetchFn: async () => {
      const result = await getMenus()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Menu | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Menu | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      try {
        const full = await getMenu((item as Menu).id)
        setSelected(full)
      } catch {
        setSelected(item as Menu)
      }
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteMenu((item as Menu).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.menus.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: MenuPayload) => {
    try {
      if (selected) {
        await updateMenu(selected.id, payload)
      } else {
        await createMenu(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.menus.tab.errors.saveFailed', { error: err.message }))
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
      <SchemaTable
        schema={menusSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getMenu(typeof id === 'string' ? parseInt(id) : id)}
      />
      <MenuEditDialog
        open={editOpen}
        menu={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default MenusTab
