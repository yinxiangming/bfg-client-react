'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { getMyResalePreference, updateMyResalePreference } from '../../services'
import type { ResaleCustomerPreference } from '../../types'

const ResalePreference = () => {
  const t = useTranslations('resale')
  const [preference, setPreference] = useState<ResaleCustomerPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [preferredPayoutMethod, setPreferredPayoutMethod] = useState('')
  const [payoutMethodNotes, setPayoutMethodNotes] = useState('')

  useEffect(() => {
    loadPreference()
  }, [])

  const loadPreference = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyResalePreference()
      setPreference(data)
      setPreferredPayoutMethod(data.preferred_payout_method ?? '')
      setPayoutMethodNotes(data.payout_method_notes ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadPreference'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updated = await updateMyResalePreference({
        preferred_payout_method: preferredPayoutMethod.trim() || '',
        payout_method_notes: payoutMethodNotes.trim() || ''
      })
      setPreference(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('myPreference.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('myPreference.subtitle')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                {t('myPreference.saved')}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('myPreference.preferredPayoutMethod')}
                placeholder={t('myPreference.preferredPayoutMethodPlaceholder')}
                value={preferredPayoutMethod}
                onChange={e => setPreferredPayoutMethod(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('myPreference.payoutMethodNotes')}
                placeholder={t('myPreference.payoutMethodNotesPlaceholder')}
                value={payoutMethodNotes}
                onChange={e => setPayoutMethodNotes(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? t('myPreference.saving') : t('myPreference.save')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ResalePreference
