'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

import CustomTextField from '@/components/ui/TextField'
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  listEmailConfigs,
  createEmailConfig,
  updateEmailConfig,
  deleteEmailConfig,
  setDefaultEmailConfig,
  sendTestEmail,
  type EmailConfig,
  type EmailConfigPayload,
  type EmailConfigSmtp,
  type EmailConfigMailgun
} from '@/services/emailConfig'

const emptySmtp = (): EmailConfigSmtp => ({
  host: '',
  port: 587,
  use_tls: true,
  use_ssl: false,
  user: '',
  password: '',
  from_email: ''
})

const emptyMailgun = (): EmailConfigMailgun => ({
  api_key: '',
  domain: '',
  from_email: '',
  region: ''
})

function buildEmailConfigSchema(t: (key: string) => string): ListSchema {
  return {
    title: t('title'),
    columns: [
      { field: 'name', label: t('name'), type: 'string', sortable: true, link: 'edit' },
      {
        field: 'backend_type',
        label: t('backendType'),
        type: 'string',
        render: (_, row: EmailConfig) => (row.backend_type === 'smtp' ? t('smtp') : t('mailgun'))
      },
      {
        field: 'is_default',
        label: t('isDefault'),
        type: 'string',
        render: (_, row: EmailConfig) => (row.is_default ? t('yes') : t('dash'))
      },
      {
        field: 'is_active',
        label: t('isActive'),
        type: 'string',
        render: (_, row: EmailConfig) => (row.is_active ? t('yes') : t('no'))
      }
    ],
    searchFields: ['name'],
    actions: [
      { id: 'add', label: t('add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'setDefault', label: t('setDefault'), type: 'secondary', scope: 'row' },
      { id: 'sendTest', label: t('sendTest'), type: 'secondary', scope: 'row' },
      { id: 'edit', label: t('edit'), type: 'secondary', scope: 'row' },
      { id: 'delete', label: t('delete'), type: 'danger', scope: 'row', confirm: t('deleteConfirm') }
    ]
  }
}

export default function EmailTab() {
  const t = useTranslations('admin.settings.general.email')
  const schema = useMemo(() => buildEmailConfigSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<EmailConfig[]>({
    fetchFn: async () => {
      const result = await listEmailConfigs()
      return Array.isArray(result) ? result : []
    }
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [backendType, setBackendType] = useState<'smtp' | 'mailgun'>('smtp')
  const [config, setConfig] = useState<EmailConfigSmtp | EmailConfigMailgun>(emptySmtp())
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testConfigId, setTestConfigId] = useState<number | null>(null)
  const [testTo, setTestTo] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setName('')
    setBackendType('smtp')
    setConfig(emptySmtp())
    setIsActive(true)
    setFormOpen(true)
  }

  const openEdit = (row: EmailConfig) => {
    setEditingId(row.id)
    setName(row.name)
    setBackendType(row.backend_type)
    setConfig((row.config || {}) as EmailConfigSmtp & EmailConfigMailgun)
    setIsActive(row.is_active)
    setFormOpen(true)
  }

  const onBackendTypeChange = (value: 'smtp' | 'mailgun') => {
    setBackendType(value)
    setConfig(value === 'smtp' ? emptySmtp() : emptyMailgun())
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: EmailConfigPayload = {
        name,
        backend_type: backendType,
        config: { ...config },
        is_active: isActive
      }
      if (editingId) {
        await updateEmailConfig(editingId, payload)
        setSnack({ message: t('saved'), severity: 'success' })
      } else {
        await createEmailConfig(payload)
        setSnack({ message: t('created'), severity: 'success' })
      }
      setFormOpen(false)
      refetch()
    } catch (e: unknown) {
      setSnack({ message: t('errors.saveFailed') + (e instanceof Error ? e.message : ''), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleActionClick = async (action: SchemaAction, item: EmailConfig | Record<string, never>) => {
    if (action.id === 'add') {
      openAdd()
      return
    }
    const row = item as EmailConfig
    if (!row?.id) return

    if (action.id === 'edit') {
      openEdit(row)
      return
    }
    if (action.id === 'setDefault') {
      try {
        await setDefaultEmailConfig(row.id)
        setSnack({ message: t('setDefaultSuccess'), severity: 'success' })
        refetch()
      } catch (e: unknown) {
        setSnack({ message: e instanceof Error ? e.message : String(e), severity: 'error' })
      }
      return
    }
    if (action.id === 'sendTest') {
      setTestConfigId(row.id)
      setTestTo('')
      setTestDialogOpen(true)
      return
    }
    if (action.id === 'delete') {
      try {
        await deleteEmailConfig(row.id)
        setSnack({ message: t('deleted'), severity: 'success' })
        refetch()
      } catch (e: unknown) {
        setSnack({ message: t('errors.deleteFailed') + (e instanceof Error ? e.message : ''), severity: 'error' })
      }
    }
  }

  const handleSendTest = async () => {
    if (!testConfigId || !testTo?.trim()) {
      setSnack({ message: t('errors.toRequired'), severity: 'error' })
      return
    }
    setTestSending(true)
    try {
      await sendTestEmail(testConfigId, testTo.trim())
      setSnack({ message: t('testEmailSent'), severity: 'success' })
      setTestDialogOpen(false)
    } catch (e: unknown) {
      setSnack({ message: t('testEmailFailed', { error: e instanceof Error ? e.message : String(e) }), severity: 'error' })
    } finally {
      setTestSending(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('subtitle')}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {t('errors.loadFailed')}: {error}
        </Alert>
      )}
      <SchemaTable
        schema={schema}
        data={data ?? []}
        onActionClick={handleActionClick}
        loading={loading}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t('editTitle') : t('add')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <CustomTextField
              label={t('name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <CustomTextField
              select
              label={t('backendType')}
              value={backendType}
              onChange={(e) => onBackendTypeChange(e.target.value as 'smtp' | 'mailgun')}
              fullWidth
            >
              <MenuItem value="smtp">{t('smtp')}</MenuItem>
              <MenuItem value="mailgun">{t('mailgun')}</MenuItem>
            </CustomTextField>
            {backendType === 'smtp' && (
              <>
                <CustomTextField label={t('configSmtp.host')} value={(config as EmailConfigSmtp).host || ''} onChange={(e) => setConfig({ ...config, host: e.target.value })} fullWidth required />
                <CustomTextField label={t('configSmtp.port')} type="number" value={(config as EmailConfigSmtp).port ?? 587} onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) || 587 })} fullWidth />
                <FormControlLabel control={<Switch checked={(config as EmailConfigSmtp).use_tls ?? true} onChange={(e) => setConfig({ ...config, use_tls: e.target.checked })} />} label={t('configSmtp.useTls')} />
                <FormControlLabel control={<Switch checked={(config as EmailConfigSmtp).use_ssl ?? false} onChange={(e) => setConfig({ ...config, use_ssl: e.target.checked })} />} label={t('configSmtp.useSsl')} />
                <CustomTextField label={t('configSmtp.user')} value={(config as EmailConfigSmtp).user || ''} onChange={(e) => setConfig({ ...config, user: e.target.value })} fullWidth />
                <CustomTextField label={t('configSmtp.password')} type="password" value={(config as EmailConfigSmtp).password || ''} onChange={(e) => setConfig({ ...config, password: e.target.value })} fullWidth placeholder={editingId ? t('configSmtp.passwordPlaceholder') : ''} />
                <CustomTextField label={t('configSmtp.fromEmail')} type="email" value={(config as EmailConfigSmtp).from_email || ''} onChange={(e) => setConfig({ ...config, from_email: e.target.value })} fullWidth required />
              </>
            )}
            {backendType === 'mailgun' && (
              <>
                <CustomTextField label={t('configMailgun.apiKey')} type="password" value={(config as EmailConfigMailgun).api_key || ''} onChange={(e) => setConfig({ ...config, api_key: e.target.value })} fullWidth required placeholder={editingId ? t('configMailgun.passwordPlaceholder') : ''} />
                <CustomTextField label={t('configMailgun.domain')} value={(config as EmailConfigMailgun).domain || ''} onChange={(e) => setConfig({ ...config, domain: e.target.value })} fullWidth required />
                <CustomTextField label={t('configMailgun.fromEmail')} type="email" value={(config as EmailConfigMailgun).from_email || ''} onChange={(e) => setConfig({ ...config, from_email: e.target.value })} fullWidth required />
                <CustomTextField label={t('configMailgun.region')} value={(config as EmailConfigMailgun).region || ''} onChange={(e) => setConfig({ ...config, region: e.target.value })} fullWidth placeholder={t('configMailgun.regionPlaceholder')} />
              </>
            )}
            <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label={t('isActive')} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)}>
        <DialogTitle>{t('sendTest')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('testEmailTo')}
            type="email"
            fullWidth
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSendTest} disabled={testSending || !testTo.trim()}>
            {testSending ? t('sending') : t('send')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert> : null}
      </Snackbar>
    </Box>
  )
}
