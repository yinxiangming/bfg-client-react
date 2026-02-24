'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { bfgApi } from '@/utils/api'
import { getWorkspaceSettings, updateMarketingSettings, type MarketingSettingsPayload } from '@/services/settings'

const buildMarketingFormSchema = (t: any): FormSchema => ({
  title: t('settings.marketing.settingsTab.title'),
  fields: [
    {
      field: 'default_referral_program_id',
      label: t('settings.marketing.settingsTab.fields.defaultReferralProgram'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.referralPrograms(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'utm_source', label: t('settings.marketing.settingsTab.fields.utmSource'), type: 'string' },
    { field: 'utm_medium', label: t('settings.marketing.settingsTab.fields.utmMedium'), type: 'string' },
    {
      field: 'utm_campaign',
      label: t('settings.marketing.settingsTab.fields.utmCampaign'),
      type: 'string',
      placeholder: t('settings.marketing.settingsTab.placeholders.utmCampaign')
    }
  ]
})

const MarketingSettingsTab = () => {
  const t = useTranslations('admin')
  const marketingFormSchema = useMemo(() => buildMarketingFormSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Array<MarketingSettingsPayload & { id: number }>>({
    fetchFn: async () => {
      const settings = await getWorkspaceSettings()
      const marketing = (settings.custom_settings as any)?.marketing || {}
      return [
        {
          id: settings.id,
          default_referral_program_id: marketing.default_referral_program_id ?? undefined,
          utm_source: marketing.utm_source || '',
          utm_medium: marketing.utm_medium || '',
          utm_campaign: marketing.utm_campaign || ''
        }
      ]
    }
  })

  const handleSubmit = async (payload: MarketingSettingsPayload) => {
    try {
      const settingsId = data && data[0]?.id
      if (!settingsId) {
        alert(t('settings.marketing.settingsTab.errors.noWorkspaceSettings'))
        return
      }
      await updateMarketingSettings(settingsId, payload)
      await refetch()
      alert(t('settings.marketing.settingsTab.snackbar.saved'))
    } catch (err: any) {
      alert(t('settings.marketing.settingsTab.errors.saveFailed', { error: err.message }))
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

  const initial = data && data[0] ? data[0] : undefined

  return (
    <Box sx={{ p: 4 }}>
      <SchemaForm schema={marketingFormSchema} initialData={initial} onSubmit={handleSubmit} onCancel={() => {}} />
    </Box>
  )
}

export default MarketingSettingsTab

