'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'
import { useAppDialog } from '@/contexts/AppDialogContext'

// Service Imports
import {
  getInvoiceSettings,
  getInvoiceSetting,
  createInvoiceSetting,
  updateInvoiceSetting,
  deleteInvoiceSetting,
  type InvoiceSetting,
  type InvoiceSettingPayload
} from '@/services/finance'

// Component Imports
import InvoiceSettingEditDialog from './InvoiceSettingEditDialog'

const InvoiceSettingsTab = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  // States
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<InvoiceSetting | null>(null)

  const { data, loading, error, refetch } = useApiData<InvoiceSetting[]>({
    fetchFn: async () => {
      const result = await getInvoiceSettings()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })

  const handleActionClick = async (setting: InvoiceSetting, action: 'edit' | 'delete') => {
    if (action === 'edit') {
      setSelected(setting)
      setEditOpen(true)
    } else if (action === 'delete') {
      if (await confirm(t('settings.finance.invoiceSettings.tab.confirmDelete'), { danger: true })) {
        try {
          await deleteInvoiceSetting(setting.id)
          await refetch()
        } catch (err: any) {
          alert(t('settings.finance.invoiceSettings.tab.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  const handleAddClick = () => {
    setSelected(null)
    setEditOpen(true)
  }

  const handleSave = async (payload: InvoiceSettingPayload) => {
    try {
      if (selected) {
        await updateInvoiceSetting(selected.id, payload)
      } else {
        await createInvoiceSetting(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.invoiceSettings.tab.errors.saveFailed', { error: err.message }))
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
        <Typography color='error'>{error}</Typography>
      </Box>
    )
  }

  const firstSetting = data && data[0]

  return (
    <Card>
      <CardContent>
        <div className='flex justify-end mb-4'>
          {firstSetting ? (
            <Button variant='contained' onClick={() => handleActionClick(firstSetting, 'edit')} className='whitespace-nowrap'>
              {t('settings.finance.invoiceSettings.tab.actions.edit')}
            </Button>
          ) : (
            <Button variant='contained' onClick={handleAddClick} className='whitespace-nowrap'>
              {t('settings.finance.invoiceSettings.tab.actions.add')}
            </Button>
          )}
        </div>

        {firstSetting && (
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              {t('settings.finance.invoiceSettings.tab.current.title')}
            </Typography>
            <Typography>
              <strong>{t('settings.finance.invoiceSettings.tab.current.prefix')}:</strong> {firstSetting.invoice_prefix}
            </Typography>
            <Typography>
              <strong>{t('settings.finance.invoiceSettings.tab.current.defaultDueDays')}:</strong> {firstSetting.default_due_days}
            </Typography>
            <Typography>
              <strong>{t('settings.finance.invoiceSettings.tab.current.autoNumber')}:</strong>{' '}
              {firstSetting.enable_auto_number ? t('settings.finance.invoiceSettings.tab.current.enabled') : t('settings.finance.invoiceSettings.tab.current.disabled')}
            </Typography>
            <Typography>
              <strong>{t('settings.finance.invoiceSettings.tab.current.status')}:</strong>{' '}
              {firstSetting.is_active ? t('settings.finance.invoiceSettings.tab.current.active') : t('settings.finance.invoiceSettings.tab.current.inactive')}
            </Typography>
          </Box>
        )}

        {!firstSetting && (
          <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
            {t('settings.finance.invoiceSettings.tab.empty')}
          </Typography>
        )}
      </CardContent>
      <InvoiceSettingEditDialog
        open={editOpen}
        setting={selected || firstSetting || null}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </Card>
  )
}

export default InvoiceSettingsTab
