'use client'

import React, { useEffect, useState } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useExtensions } from '@/extensions/context'
import {
  buildDashboardBlockRegistry,
  getDashboardBlocksByCategory,
  getDashboardBlockDefinition,
  getDashboardBlockComponent,
  getDashboardBlockSettingsEditor,
} from '@/views/admin/dashboard/registry'
import { PageRenderer } from '@/views/common/blocks'
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
  type DashboardLayout,
} from '@/views/admin/dashboard/defaultLayout'
import { DashboardLayoutEditor } from '@/views/admin/dashboard/DashboardLayoutEditor'
import { SettingsActionBar } from '@/components/admin/settings/SettingsSection'
import { meApi } from '@/utils/meApi'

const DASHBOARD_LAYOUT_KEY = 'dashboard_layout'

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard')
  const extensions = useExtensions()
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingLayout, setPendingLayout] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUT)
  const [saving, setSaving] = useState(false)

  // Build dashboard registry (core + extension blocks); run on mount and when extensions load
  useEffect(() => {
    buildDashboardBlockRegistry(extensions?.extensions ?? [])
  }, [extensions?.extensions])

  // Load user dashboard layout from me/settings
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const settings = await meApi.getSettings()
        const raw = settings?.custom_preferences?.[DASHBOARD_LAYOUT_KEY]
        const resolved = normalizeDashboardLayout(raw)
        if (!cancelled) setLayout(resolved)
        if (!cancelled) setPendingLayout(resolved)
      } catch {
        if (!cancelled) {
          setLayout(DEFAULT_DASHBOARD_LAYOUT)
          setPendingLayout(DEFAULT_DASHBOARD_LAYOUT)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      const settings = await meApi.getSettings()
      const prefs = settings?.custom_preferences ?? {}
      await meApi.updateSettings({
        custom_preferences: { ...prefs, [DASHBOARD_LAYOUT_KEY]: pendingLayout },
      })
      setLayout(pendingLayout)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const layoutToRender = layout ?? DEFAULT_DASHBOARD_LAYOUT
  const hasAnyBlocks = layoutToRender.left.length > 0 || layoutToRender.right.length > 0

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isEditing) {
    return (
      <Box>
        <AdminPageHeader title={t('editTitle')} />
        <DashboardLayoutEditor
          initialLayout={pendingLayout}
          onLayoutChange={setPendingLayout}
          locale="en"
          getBlocksByCategory={getDashboardBlocksByCategory}
          getBlockDefinition={getDashboardBlockDefinition}
          getBlockComponent={getDashboardBlockComponent}
          getBlockSettingsEditor={getDashboardBlockSettingsEditor}
        />
        {/* Docked: the editor is a full-height column, so a trailing button row
            would scroll out of reach as soon as a column fills up. */}
        <SettingsActionBar>
          <Button variant="contained" onClick={handleSaveLayout} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setIsEditing(false)
              setPendingLayout(layout ?? DEFAULT_DASHBOARD_LAYOUT)
            }}
            disabled={saving}
          >
            {t('cancel')}
          </Button>
        </SettingsActionBar>
      </Box>
    )
  }

  return (
    <Box>
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:pencil" />}
            onClick={() => setIsEditing(true)}
          >
            {t('editLayout')}
          </Button>
        }
      />

      {!hasAnyBlocks ? (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography>{t('emptyHint')}</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => setIsEditing(true)}
          >
            {t('editLayout')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PageRenderer
              blocks={layoutToRender.left}
              locale="en"
              isEditing={false}
              getBlockComponent={getDashboardBlockComponent}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <PageRenderer
              blocks={layoutToRender.right}
              locale="en"
              isEditing={false}
              getBlockComponent={getDashboardBlockComponent}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}
