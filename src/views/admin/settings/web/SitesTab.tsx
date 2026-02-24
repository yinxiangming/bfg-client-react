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
import SiteEditDialog from './SiteEditDialog'
import {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  type Site,
  type SitePayload
} from '@/services/web'

const buildSitesSchema = (t: any): ListSchema => ({
  title: t('settings.web.sites.tab.title'),
  columns: [
    { field: 'name', label: t('settings.web.sites.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'domain', label: t('settings.web.sites.tab.columns.domain'), type: 'string', sortable: true },
    { field: 'theme_name', label: t('settings.web.sites.tab.columns.theme'), type: 'string' },
    { field: 'default_language', label: t('settings.web.sites.tab.columns.defaultLanguage'), type: 'string' },
    { field: 'is_default', label: t('settings.web.sites.tab.columns.isDefault'), type: 'select', sortable: true },
    { field: 'is_active', label: t('settings.web.sites.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'domain'],
  actions: [
    { id: 'add', label: t('settings.web.sites.tab.actions.newSite'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.sites.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.sites.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.sites.tab.actions.confirmDelete')
    }
  ]
})

const SitesTab = () => {
  const t = useTranslations('admin')
  const sitesSchema = useMemo(() => buildSitesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Site[]>({
    fetchFn: async () => {
      const result = await getSites()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Site | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Site | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Site)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteSite((item as Site).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.sites.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: SitePayload) => {
    try {
      if (selected) {
        await updateSite(selected.id, payload)
      } else {
        await createSite(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.sites.tab.errors.saveFailed', { error: err.message }))
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
        schema={sitesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getSite(typeof id === 'string' ? parseInt(id) : id)}
      />
      <SiteEditDialog
        open={editOpen}
        site={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default SitesTab
