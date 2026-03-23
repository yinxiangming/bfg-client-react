'use client'

// React Imports
import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'

// Data Imports
import { buildAPIKeysSchema } from '@/data/settingsSchemas'

// Service Imports
import {
  getAPIKeys,
  getAPIKey,
  createAPIKey,
  updateAPIKey,
  deleteAPIKey,
  regenerateAPIKey,
  type APIKey,
  type APIKeyCreateResponse
} from '@/services/settings'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

const APIKeysTab = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const apiKeysSchema = useMemo(() => buildAPIKeysSchema(t), [t])

  const { data: apiKeys, loading, error, refetch } = useApiData<APIKey[]>({
    fetchFn: getAPIKeys
  })

  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<APIKey | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Secret dialog state (shown after create or regenerate)
  const [secretDialogOpen, setSecretDialogOpen] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<APIKeyCreateResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleActionClick = async (action: SchemaAction, item: APIKey | {}) => {
    if (action.id === 'add') {
      setEditingKey(null)
      setDialogOpen(true)
    } else if (action.id === 'edit' && 'id' in item) {
      try {
        const key = await getAPIKey(item.id)
        setEditingKey(key)
        setDialogOpen(true)
      } catch (err: any) {
        alert(t('settings.general.apiKeys.errors.fetchFailed', { error: err.message }))
      }
    } else if (action.id === 'regenerate' && 'id' in item) {
      if (await confirm(t('settings.general.apiKeys.actions.confirmRegenerate'), { danger: true })) {
        try {
          const result = await regenerateAPIKey(item.id)
          setCreatedSecret(result)
          setSecretDialogOpen(true)
          await refetch()
        } catch (err: any) {
          alert(t('settings.general.apiKeys.errors.regenerateFailed', { error: err.message }))
        }
      }
    } else if (action.id === 'delete' && 'id' in item) {
      if (await confirm(t('settings.general.apiKeys.actions.confirmDeleteWithName', { name: (item as any).name }), { danger: true })) {
        try {
          await deleteAPIKey(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('settings.general.apiKeys.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true)
    try {
      if (editingKey) {
        await updateAPIKey(editingKey.id, data)
        await refetch()
        setDialogOpen(false)
        setEditingKey(null)
      } else {
        // Create — show secret dialog
        const result = await createAPIKey(data)
        await refetch()
        setDialogOpen(false)
        setEditingKey(null)
        // Show secret
        setCreatedSecret(result)
        setSecretDialogOpen(true)
      }
    } catch (err: any) {
      alert(t('settings.general.apiKeys.errors.saveFailed', { error: err.message }))
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setDialogOpen(false)
    setEditingKey(null)
  }

  const handleSecretDialogClose = () => {
    setSecretDialogOpen(false)
    setCreatedSecret(null)
    setCopiedField(null)
  }

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  if (loading && (!apiKeys || apiKeys.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!apiKeysSchema.list) {
    return <Alert severity='error'>{t('settings.general.apiKeys.errors.schemaNotFound')}</Alert>
  }

  return (
    <>
      <SchemaTable
        schema={apiKeysSchema.list}
        data={apiKeys || []}
        loading={loading}
        onActionClick={handleActionClick}
        statusColors={{
          true: 'success',
          false: 'default',
          active: 'success',
          inactive: 'default'
        }}
      />

      {/* Create / Edit Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {apiKeysSchema.form && (
            <SchemaForm
              schema={apiKeysSchema.form}
              initialData={editingKey || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Secret Reveal Dialog */}
      <Dialog
        open={secretDialogOpen}
        onClose={handleSecretDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='tabler-key' style={{ fontSize: 24 }} />
            {t('settings.general.apiKeys.secretDialog.title')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 3 }}>
            {t('settings.general.apiKeys.secretDialog.warning')}
          </Alert>

          {createdSecret && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* API Key (prefix) */}
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                  {t('settings.general.apiKeys.secretDialog.apiKeyLabel')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all'
                  }}
                >
                  <Box sx={{ flex: 1 }}>{createdSecret.api_key}</Box>
                  <Tooltip title={copiedField === 'key' ? t('settings.general.apiKeys.secretDialog.copied') : t('settings.general.apiKeys.secretDialog.copy')}>
                    <IconButton size='small' onClick={() => handleCopy(createdSecret.api_key, 'key')}>
                      <i className={copiedField === 'key' ? 'tabler-check' : 'tabler-copy'} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* API Secret */}
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                  {t('settings.general.apiKeys.secretDialog.apiSecretLabel')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all'
                  }}
                >
                  <Box sx={{ flex: 1 }}>{createdSecret.api_secret}</Box>
                  <Tooltip title={copiedField === 'secret' ? t('settings.general.apiKeys.secretDialog.copied') : t('settings.general.apiKeys.secretDialog.copy')}>
                    <IconButton size='small' onClick={() => handleCopy(createdSecret.api_secret, 'secret')}>
                      <i className={copiedField === 'secret' ? 'tabler-check' : 'tabler-copy'} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='contained' onClick={handleSecretDialogClose}>
            {t('settings.general.apiKeys.secretDialog.done')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default APIKeysTab
