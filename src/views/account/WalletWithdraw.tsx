'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { getMyWallet, createWithdrawalRequest } from '@/services/finance'

function formatCurrency(amount: number, currency: string): string {
  const sym = currency === 'NZD' || currency === 'USD' ? '$' : `${currency} `
  return `${sym}${Number(amount).toFixed(2)}`
}

export default function WalletWithdraw() {
  const t = useTranslations('account')
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/account'

  const [wallet, setWallet] = useState<{
    id: number
    cash_balance: number
    currency: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getMyWallet().then((data) => {
      if (data && data.id != null) {
        const cash = Number(data.cash_balance) ?? 0
        if (cash > 0) {
          setWallet({
            id: data.id,
            cash_balance: cash,
            currency: data.currency || 'NZD'
          })
        } else {
          setWallet(null)
        }
      } else {
        setWallet(null)
      }
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return
    const numAmount = parseFloat(amount)
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setError(t('wallet.withdraw.validation.amountRequired'))
      return
    }
    if (numAmount > wallet.cash_balance) {
      setError(t('wallet.withdraw.validation.amountExceeds'))
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createWithdrawalRequest(wallet.id, {
        amount: numAmount,
        payout_method: payoutMethod.trim() || undefined,
        notes: notes.trim() || undefined
      })
      router.push(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wallet.withdraw.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!wallet) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Alert severity="info">{t('wallet.withdraw.noCashBalance')}</Alert>
          <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push(returnUrl)}>
            {t('wallet.withdraw.backToAccount')}
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent sx={{ maxWidth: 480 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('wallet.withdraw.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('wallet.withdraw.subtitle')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('wallet.withdraw.available')}: <strong>{formatCurrency(wallet.cash_balance, wallet.currency)}</strong>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('wallet.withdraw.amount')}
                type="number"
                inputProps={{ min: 0.01, max: wallet.cash_balance, step: 0.01 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label={t('wallet.withdraw.payoutMethod')}
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                placeholder={t('wallet.withdraw.payoutMethodPlaceholder')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('wallet.withdraw.notes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? t('wallet.withdraw.submitting') : t('wallet.withdraw.submit')}
                </Button>
                <Button variant="outlined" onClick={() => router.push(returnUrl)}>
                  {t('wallet.withdraw.cancel')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
