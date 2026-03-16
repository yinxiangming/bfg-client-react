'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getWorkspaceSettings, updateSupportSettings, type SupportSettingsPayload } from '@/services/settings'

const buildSupportFormSchema = (t: (key: string) => string): FormSchema => ({
  title: t('settings.support.settingsTab.title'),
  fields: [
    {
      field: 'support_email',
      label: t('settings.support.settingsTab.fields.supportEmail'),
      type: 'email',
      placeholder: t('settings.support.settingsTab.placeholders.supportEmail'),
      helperText: t('settings.support.settingsTab.fields.supportEmailHelp')
    }
  ],
  actions: [
    { id: 'submit', label: t('settings.support.settingsTab.actions.save'), type: 'submit' },
    { id: 'cancel', label: t('common.actions.cancel'), type: 'cancel' }
  ]
})

const SupportSettingsTab = () => {
  const t = useTranslations('admin')
  const formSchema = useMemo(() => buildSupportFormSchema(t), [t])

  const { data: settings, loading, error, refetch } = useApiData<Awaited<ReturnType<typeof getWorkspaceSettings>>>({
    fetchFn: getWorkspaceSettings
  })

  const handleSubmit = async (payload: SupportSettingsPayload) => {
    if (!settings?.id) {
      alert(t('settings.support.settingsTab.errors.noWorkspaceSettings'))
      return
    }
    try {
      await updateSupportSettings(settings.id, payload)
      await refetch()
      alert(t('settings.support.settingsTab.snackbar.saved'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(t('settings.support.settingsTab.errors.saveFailed', { error: msg }))
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

  const initial = settings
    ? { support_email: settings.support_email ?? '' }
    : undefined

  return (
    <Box sx={{ p: 4 }}>
      <SchemaForm
        schema={formSchema}
        initialData={initial}
        onSubmit={handleSubmit}
        onCancel={() => {}}
      />
    </Box>
  )
}

export default SupportSettingsTab
