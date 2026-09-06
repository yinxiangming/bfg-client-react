'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { ADMIN_GUTTER } from '@/components/theme/adminSurface'
import CustomTextField from '@/components/ui/TextField'
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  listSocialAuthConfigs,
  createSocialAuthConfig,
  updateSocialAuthConfig,
  deleteSocialAuthConfig,
  getSocialAuthProviders,
  SECRET_MASK,
  type SocialAuthConfig,
  type SocialAuthConfigPayload,
  type SocialAuthProvider,
  type SocialAuthProviderInfo
} from '@/services/socialAuthConfig'

type FormState = {
  provider: SocialAuthProvider
  clientId: string
  secret: string
  key: string
  certificateKey: string
  isActive: boolean
}

const emptyForm = (provider: SocialAuthProvider = 'google'): FormState => ({
  provider,
  clientId: '',
  secret: '',
  key: '',
  certificateKey: '',
  isActive: true
})

function buildSchema(t: (key: string) => string): ListSchema {
  return {
    title: t('title'),
    columns: [
      { field: 'provider_display', label: t('provider'), type: 'string', link: 'edit' },
      { field: 'client_id', label: t('clientId'), type: 'string' },
      {
        field: 'is_configured',
        label: t('status'),
        type: 'string',
        render: (_, row: SocialAuthConfig) => {
          if (!row.is_active) return t('statusOff')
          return row.is_configured ? t('statusLive') : t('statusIncomplete')
        }
      }
    ],
    searchFields: ['client_id'],
    actions: [
      { id: 'add', label: t('add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'edit', label: t('edit'), type: 'secondary', scope: 'row' },
      { id: 'delete', label: t('delete'), type: 'danger', scope: 'row', confirm: t('deleteConfirm') }
    ]
  }
}

/**
 * One row to copy into the provider's console.
 *
 * These values are why registering an OAuth client goes wrong: an origin that
 * is missing, a redirect URI that differs by a trailing slash. Both fail at the
 * provider with nothing but `invalid_client` to go on, so the exact strings are
 * shown here rather than written down somewhere that drifts.
 */
function CopyableValue({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
          {value}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => onCopy(value)} aria-label={label}>
        <i className="tabler-copy" />
      </IconButton>
    </Box>
  )
}

export default function SocialLoginTab() {
  const t = useTranslations('admin.settings.general.socialLogin')
  const schema = useMemo(() => buildSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<SocialAuthConfig[]>({
    fetchFn: async () => {
      const result = await listSocialAuthConfigs()
      return Array.isArray(result) ? result : []
    }
  })
  const { data: providerInfo } = useApiData<SocialAuthProviderInfo[]>({
    fetchFn: async () => {
      const result = await getSocialAuthProviders()
      return Array.isArray(result) ? result : []
    }
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const configs = data ?? []
  const selected = providerInfo?.find(p => p.id === form.provider)
  // Without this the table reads as "no social login configured" while the
  // sign-in page plainly shows a working Google button, and nothing on screen
  // explains where that client came from.
  const inherited = (providerInfo ?? []).filter(p => p.inherited_from_platform)
  // Adding a second config for a provider the workspace already has would be
  // rejected by the server, so it is not offered.
  const takenProviders = new Set(configs.filter(c => c.id !== editingId).map(c => c.provider))
  const providerChoices = (providerInfo ?? []).filter(p => editingId !== null || !takenProviders.has(p.id))

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setSnack({ message: t('copied'), severity: 'success' })
    } catch {
      setSnack({ message: t('errors.copyFailed'), severity: 'error' })
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm(providerChoices[0]?.id ?? 'google'))
    setFormOpen(true)
  }

  const openEdit = (row: SocialAuthConfig) => {
    setEditingId(row.id)
    setForm({
      provider: row.provider,
      clientId: row.client_id,
      // The stored secret is never sent to the browser. Round-tripping the mask
      // is what tells the server "unchanged" when the admin edits another field.
      secret: row.secret || '',
      key: row.key || '',
      certificateKey: '',
      isActive: row.is_active
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: SocialAuthConfigPayload = {
        provider: form.provider,
        client_id: form.clientId.trim(),
        secret: form.secret,
        is_active: form.isActive
      }
      if (form.provider === 'apple') {
        payload.key = form.key.trim()
        // Blank means "keep the key already on file" — it is write-only, so the
        // form can never render the current value to send back.
        if (form.certificateKey.trim()) payload.certificate_key = form.certificateKey.trim()
      }
      if (editingId) {
        await updateSocialAuthConfig(editingId, payload)
        setSnack({ message: t('saved'), severity: 'success' })
      } else {
        await createSocialAuthConfig(payload)
        setSnack({ message: t('created'), severity: 'success' })
      }
      setFormOpen(false)
      refetch()
    } catch (e: unknown) {
      setSnack({
        message: `${t('errors.saveFailed')} ${e instanceof Error ? e.message : ''}`.trim(),
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleActionClick = async (action: SchemaAction, item: SocialAuthConfig | Record<string, never>) => {
    if (action.id === 'add') {
      openAdd()
      return
    }
    const row = item as SocialAuthConfig
    if (!row?.id) return

    if (action.id === 'edit') {
      openEdit(row)
      return
    }
    if (action.id === 'delete') {
      try {
        await deleteSocialAuthConfig(row.id)
        setSnack({ message: t('deleted'), severity: 'success' })
        refetch()
      } catch (e: unknown) {
        setSnack({
          message: `${t('errors.deleteFailed')} ${e instanceof Error ? e.message : ''}`.trim(),
          severity: 'error'
        })
      }
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
      <Box sx={{ px: `${ADMIN_GUTTER}px`, pt: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
        {inherited.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {t('inheritedNotice', { providers: inherited.map(p => p.label).join('、') })}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t('errors.loadFailed')}: {error}
          </Alert>
        )}
      </Box>
      <SchemaTable schema={schema} data={configs} onActionClick={handleActionClick} loading={loading} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t('editTitle') : t('add')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <CustomTextField
              select
              label={t('provider')}
              value={form.provider}
              onChange={e => setForm({ ...form, provider: e.target.value as SocialAuthProvider })}
              fullWidth
              disabled={editingId !== null}
              helperText={editingId !== null ? t('providerLocked') : undefined}
            >
              {providerChoices.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label}
                </MenuItem>
              ))}
            </CustomTextField>

            {/* A plain surface, not an <Alert>: the info alert paints a fixed
                light background, which leaves theme-coloured labels and icon
                buttons invisible in dark mode. */}
            {selected?.inherited_from_platform && !editingId && (
              <Typography variant="caption" color="text.secondary">
                {t('overrideNotice')}
              </Typography>
            )}

            {selected && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('consoleHeading')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <CopyableValue label={t('redirectUri')} value={selected.redirect_uri} onCopy={copy} />
                  {selected.javascript_origins.length > 0 ? (
                    selected.javascript_origins.map(origin => (
                      <CopyableValue key={origin} label={t('jsOrigin')} value={origin} onCopy={copy} />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {t('noDomains')}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <CustomTextField
              label={t('clientId')}
              value={form.clientId}
              onChange={e => setForm({ ...form, clientId: e.target.value })}
              fullWidth
              required
            />
            <CustomTextField
              label={t('secret')}
              type="password"
              value={form.secret}
              onChange={e => setForm({ ...form, secret: e.target.value })}
              fullWidth
              required
              placeholder={editingId ? t('secretPlaceholder') : ''}
              helperText={editingId && form.secret === SECRET_MASK ? t('secretUnchanged') : undefined}
            />

            {form.provider === 'apple' && (
              <>
                <CustomTextField
                  label={t('appleKeyId')}
                  value={form.key}
                  onChange={e => setForm({ ...form, key: e.target.value })}
                  fullWidth
                  required
                />
                <CustomTextField
                  label={t('appleCertificateKey')}
                  value={form.certificateKey}
                  onChange={e => setForm({ ...form, certificateKey: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder={t('appleCertificateKeyPlaceholder')}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              }
              label={t('isActive')}
            />
            <Typography variant="caption" color="text.secondary">
              {t('activeHint')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}
