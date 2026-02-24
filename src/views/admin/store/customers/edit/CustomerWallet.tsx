'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Snackbar from '@mui/material/Snackbar'

// Type Imports
import type { Customer } from '@/services/store'
import { apiFetch, bfgApi } from '@/utils/api'

// Component Imports
import TransactionHistoryModal from './TransactionHistoryModal'

type CustomerWalletProps = {
  customer: Customer
  onUpdate?: () => void
}

const CustomerWallet = ({ customer, onUpdate }: CustomerWalletProps) => {
  const t = useTranslations('admin')
  const [wallet, setWallet] = useState<{
    balance: number
    credit_limit: number
    currency: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpNote, setTopUpNote] = useState('')
  const [toppingUp, setToppingUp] = useState(false)
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchWallet()
  }, [customer.id])

  const fetchWallet = async () => {
    try {
      setLoading(true)
      // Try to get wallet from customer detail or fetch separately
      const walletData = await apiFetch<{
        balance: number | string
        credit_limit: number | string
        currency: string
      }>(`${bfgApi.customers()}${customer.id}/wallet/`).catch(() => {
        // Fallback to customer balance if wallet endpoint doesn't exist
        return {
          balance: customer.balance || 0,
          credit_limit: customer.credit_limit || 0,
          currency: 'NZD'
        }
      })
      // Ensure balance and credit_limit are numbers
      setWallet({
        balance: Number(walletData.balance) || 0,
        credit_limit: Number(walletData.credit_limit) || 0,
        currency: walletData.currency || 'NZD'
      })
    } catch (error) {
      console.error('Failed to fetch wallet', error)
      // Use customer balance as fallback
      setWallet({
        balance: Number(customer.balance) || 0,
        credit_limit: Number(customer.credit_limit) || 0,
        currency: 'NZD'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount <= 0) {
      setSnackbar({
        open: true,
        message: t('customers.wallet.validation.amountInvalid'),
        severity: 'warning'
      })
      return
    }
    setPendingAmount(amount)
    setTopUpDialogOpen(true)
  }

  const handleTopUpConfirm = async () => {
    if (!pendingAmount) return
    setTopUpDialogOpen(false)
    setToppingUp(true)
    try {
      // Create a transaction for top-up
      await apiFetch(`${bfgApi.customers()}${customer.id}/wallet/topup/`, {
        method: 'POST',
        body: JSON.stringify({
          amount: pendingAmount,
          note: topUpNote || t('customers.wallet.defaults.adminTopUpNote')
        })
      }).catch(async () => {
        // Fallback: update customer balance directly
        const { updateCustomer } = await import('@/services/store')
        await updateCustomer(customer.id, {
          balance: (customer.balance || 0) + pendingAmount
        })
      })
      
      setTopUpAmount('')
      setTopUpNote('')
      await fetchWallet()
      if (onUpdate) {
        onUpdate()
      }
      setSnackbar({
        open: true,
        message: t('customers.wallet.snackbar.toppedUp'),
        severity: 'success'
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.wallet.snackbar.topUpFailed', { error: error.message }),
        severity: 'error'
      })
    } finally {
      setToppingUp(false)
      setPendingAmount(null)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (loading) {
    return <Typography>{t('customers.wallet.states.loading')}</Typography>
  }

  const walletData = wallet || {
    balance: customer.balance || 0,
    credit_limit: customer.credit_limit || 0,
    currency: 'NZD'
  }

  // Ensure balance and credit_limit are numbers
  const balance = Number(walletData.balance) || 0
  const creditLimit = Number(walletData.credit_limit) || 0

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant='h6'>{t('customers.wallet.title')}</Typography>
              <Button
                variant='outlined'
                size='small'
                onClick={() => setTransactionModalOpen(true)}
                startIcon={<i className='tabler-history' />}
              >
                {t('customers.wallet.actions.viewHistory')}
              </Button>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant='h4' color='primary'>
                {balance.toFixed(2)} {walletData.currency}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {t('customers.wallet.labels.availableCredit')}: {creditLimit.toFixed(2)} {walletData.currency}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('customers.wallet.labels.totalAvailable')}: {(balance + creditLimit).toFixed(2)} {walletData.currency}
              </Typography>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>
              {t('customers.wallet.topUp.title')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.wallet.topUp.fields.amount.label')}
                  type='number'
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{walletData.currency}</Typography>
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.wallet.topUp.fields.note.label')}
                  multiline
                  rows={2}
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  placeholder={t('customers.wallet.topUp.fields.note.placeholder')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant='contained'
                  onClick={handleTopUp}
                  disabled={toppingUp || !topUpAmount}
                >
                  {toppingUp ? t('customers.wallet.topUp.actions.processing') : t('customers.wallet.topUp.actions.topUp')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 4 }}>
              {t('customers.wallet.sidebar.title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  {t('customers.wallet.sidebar.currentBalance')}
                </Typography>
                <Typography variant='h6'>
                  {balance.toFixed(2)} {walletData.currency}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  {t('customers.wallet.sidebar.creditLimit')}
                </Typography>
                <Typography variant='h6'>
                  {creditLimit.toFixed(2)} {walletData.currency}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  {t('customers.wallet.sidebar.totalAvailable')}
                </Typography>
                <Typography variant='h6' color='success.main'>
                  {(balance + creditLimit).toFixed(2)} {walletData.currency}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <TransactionHistoryModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        customerId={customer.id}
      />

      {/* Top Up Confirmation Dialog */}
      <Dialog open={topUpDialogOpen} onClose={() => setTopUpDialogOpen(false)}>
        <DialogTitle>{t('customers.wallet.topUp.confirmDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.wallet.topUp.confirmDialog.message', {
              amount: pendingAmount ?? 0,
              currency: wallet?.currency || 'NZD'
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialogOpen(false)}>{t('customers.wallet.topUp.actions.cancel')}</Button>
          <Button onClick={handleTopUpConfirm} variant='contained'>
            {t('customers.wallet.topUp.actions.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default CustomerWallet
