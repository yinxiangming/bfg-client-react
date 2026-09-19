'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { getCustomer, type Customer } from '@/services/store'

type Props = {
  open: boolean
  customerId: number | null
  onClose: () => void
}

const CJK_RE = /[一-鿿]/

/** Same rule as `User.get_full_name()` server-side: the order belongs to the
 *  name, not to the viewer's locale, so a CJK name reads surname-first. */
const displayName = (customer: Customer | null): string => {
  const first = (customer?.user?.first_name || '').trim()
  const last = (customer?.user?.last_name || '').trim()
  if (first || last) {
    return CJK_RE.test(`${first}${last}`) ? `${last}${first}` : [first, last].filter(Boolean).join(' ')
  }
  return customer?.customer_number || '-'
}

/**
 * Who the order belongs to and how to reach them, without leaving the list.
 *
 * Deliberately read-only: the customer page is one click away for anything
 * that needs changing, and a half-form in a lookup dialog invites edits nobody
 * meant to make.
 */
const CustomerQuickViewDialog = ({ open, customerId, onClose }: Props) => {
  const t = useTranslations('admin')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !customerId) {
      setCustomer(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getCustomer(customerId)
      .then(data => { if (!cancelled) setCustomer(data as Customer) })
      .catch(err => { if (!cancelled) setError(err?.message || t('orders.editPage.errors.fetchFailed')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, customerId, t])

  const rows: Array<[string, string | undefined]> = [
    [t('customers.page.schema.email'), customer?.user?.email || (customer as any)?.user_email],
    [t('customers.page.schema.phone'), customer?.user?.phone],
    [t('customers.page.schema.customerNumber'), customer?.customer_number]
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{displayName(customer)}</span>
        <IconButton size='small' onClick={onClose} aria-label='close'>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
        {!loading && !error && customer && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rows.map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant='body2' color='text.secondary'>{label}</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>
                  {value || '-'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.actions.close')}</Button>
        {customerId && (
          <Button variant='contained' href={`/admin/store/customers/${customerId}/edit`}>
            {t('common.actions.view')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CustomerQuickViewDialog
