'use client'

import React, { useEffect, useState } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { Icon } from '@iconify/react'
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
import { meApi } from '@/utils/meApi'

const DASHBOARD_LAYOUT_KEY = 'dashboard_layout'

export default function AdminDashboardPage() {
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
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Edit Dashboard Layout</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsEditing(false)
                setPendingLayout(layout ?? DEFAULT_DASHBOARD_LAYOUT)
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveLayout} disabled={saving}>
              {saving ? 'Saving…' : 'Save Layout'}
            </Button>
          </Box>
        </Box>
        <DashboardLayoutEditor
          initialLayout={pendingLayout}
          onLayoutChange={setPendingLayout}
          locale="en"
          getBlocksByCategory={getDashboardBlocksByCategory}
          getBlockDefinition={getDashboardBlockDefinition}
          getBlockComponent={getDashboardBlockComponent}
          getBlockSettingsEditor={getDashboardBlockSettingsEditor}
        />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:pencil" />}
          onClick={() => setIsEditing(true)}
        >
          Edit Layout
        </Button>
      </Box>

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
          <Typography>No blocks yet. Add blocks to customize your dashboard.</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => setIsEditing(true)}
          >
            Edit Layout
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PageRenderer
              blocks={layoutToRender.left}
              locale="en"
              isEditing={false}
              getBlockComponent={getDashboardBlockComponent}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
