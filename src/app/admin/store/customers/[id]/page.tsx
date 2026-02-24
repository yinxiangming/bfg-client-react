'use client'

// React Imports
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Snackbar from '@mui/material/Snackbar'

// Component Imports
import CustomerEditHeader from '@/views/admin/store/customers/edit/CustomerEditHeader'
import CustomerBasicInfo from '@/views/admin/store/customers/edit/CustomerBasicInfo'
import CustomerWallet from '@/views/admin/store/customers/edit/CustomerWallet'
import CustomerSegments from '@/views/admin/store/customers/edit/CustomerSegments'
import CustomerOrders from '@/views/admin/store/customers/edit/CustomerOrders'
import CustomerAddresses from '@/views/admin/store/customers/edit/CustomerAddresses'
import CustomerPaymentMethods from '@/views/admin/store/customers/edit/CustomerPaymentMethods'
import CustomerInbox from '@/views/admin/store/customers/edit/CustomerInbox'

// Extension Hooks
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { renderSection } from '@/extensions/hooks/renderSection'

// API Imports
import { getCustomer, type Customer } from '@/services/store'

// Extended Customer type for detail view
type CustomerDetail = Customer & {
  segments?: Array<{
    id: number
    name: string
    description?: string
  }>
  wallet?: {
    balance: number
    credit_limit: number
    currency: string
  }
  experience_points?: number
  orders_count?: number
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('admin')
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const { visibleSections, beforeSections, afterSections, replacements } =
    usePageSections('admin/store/customers/detail')

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCustomer(parseInt(id)) as CustomerDetail
      setCustomer(data)
    } catch (err: any) {
      console.error('Failed to fetch customer', err)
      setError(err.message || t('customers.detailPage.errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCustomerUpdate = () => {
    fetchCustomer()
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customer) return
    setDeleteDialogOpen(false)
    try {
      const { deleteCustomer } = await import('@/services/store')
      await deleteCustomer(customer.id)
      router.push('/admin/store/customers')
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t('customers.detailPage.snackbar.deleteFailed', { error: err.message }),
        severity: 'error'
      })
    }
  }

  const handleResetPassword = () => {
    if (!customer?.user?.email) {
      setSnackbar({
        open: true,
        message: t('customers.detailPage.snackbar.resetEmailRequired'),
        severity: 'warning'
      })
      return
    }
    setResetPasswordDialogOpen(true)
  }

  const handleResetPasswordConfirm = async () => {
    if (!customer?.user?.email) return
    setResetPasswordDialogOpen(false)
    try {
      const { apiFetch } = await import('@/utils/api')
      await apiFetch('/api/v1/me/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ email: customer.user.email })
      })
      setSnackbar({
        open: true,
        message: t('customers.detailPage.snackbar.resetEmailSent'),
        severity: 'success'
      })
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t('customers.detailPage.snackbar.resetEmailFailed', { error: err.message }),
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error || t('customers.detailPage.states.notFound')}
        </Alert>
        <Button variant='outlined' onClick={() => router.push('/admin/store/customers')}>
          {t('customers.detailPage.actions.backToCustomers')}
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <CustomerEditHeader
        customer={customer}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
      />

      {beforeSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id} sx={{ mt: 4 }}>
              <ext.component customer={customer} onUpdate={handleCustomerUpdate} />
            </Box>
          )
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={t('customers.detailPage.tabs.basicInfo')} />
          <Tab label={t('customers.detailPage.tabs.wallet')} />
          <Tab label={t('customers.detailPage.tabs.segments')} />
          <Tab label={t('customers.detailPage.tabs.orders')} />
          <Tab label={t('customers.detailPage.tabs.addresses')} />
          <Tab label={t('customers.detailPage.tabs.paymentMethods')} />
          <Tab label={t('customers.detailPage.tabs.inbox')} />
        </Tabs>
      </Box>

      <Box sx={{ mt: 4 }}>
        {activeTab === 0 &&
          visibleSections.includes('CustomerBasicInfo') &&
          renderSection(
            'CustomerBasicInfo',
            visibleSections,
            replacements,
            CustomerBasicInfo,
            { customer, onUpdate: handleCustomerUpdate }
          )}
        {activeTab === 1 &&
          visibleSections.includes('CustomerWallet') &&
          renderSection(
            'CustomerWallet',
            visibleSections,
            replacements,
            CustomerWallet,
            { customer, onUpdate: handleCustomerUpdate }
          )}
        {activeTab === 2 &&
          visibleSections.includes('CustomerSegments') &&
          renderSection(
            'CustomerSegments',
            visibleSections,
            replacements,
            CustomerSegments,
            { customer, onUpdate: handleCustomerUpdate }
          )}
        {activeTab === 3 &&
          visibleSections.includes('CustomerOrders') &&
          renderSection(
            'CustomerOrders',
            visibleSections,
            replacements,
            CustomerOrders,
            { customerId: customer.id }
          )}
        {activeTab === 4 &&
          visibleSections.includes('CustomerAddresses') &&
          renderSection(
            'CustomerAddresses',
            visibleSections,
            replacements,
            CustomerAddresses,
            { customerId: customer.id, onUpdate: handleCustomerUpdate }
          )}
        {activeTab === 5 &&
          visibleSections.includes('CustomerPaymentMethods') &&
          renderSection(
            'CustomerPaymentMethods',
            visibleSections,
            replacements,
            CustomerPaymentMethods,
            { customerId: customer.id, onUpdate: handleCustomerUpdate }
          )}
        {activeTab === 6 &&
          visibleSections.includes('CustomerInbox') &&
          renderSection(
            'CustomerInbox',
            visibleSections,
            replacements,
            CustomerInbox,
            { customerId: customer.id }
          )}
      </Box>

      {afterSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id} sx={{ mt: 4 }}>
              <ext.component customer={customer} onUpdate={handleCustomerUpdate} />
            </Box>
          )
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('customers.detailPage.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.detailPage.deleteDialog.message', {
              name: customer?.company_name || customer?.user_email || t('customers.detailPage.deleteDialog.thisCustomer')
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('customers.detailPage.actions.cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            {t('customers.detailPage.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>{t('customers.detailPage.resetPasswordDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.detailPage.resetPasswordDialog.message', { email: customer?.user?.email || '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>{t('customers.detailPage.actions.cancel')}</Button>
          <Button onClick={handleResetPasswordConfirm} variant='contained'>
            {t('customers.detailPage.resetPasswordDialog.actions.sendEmail')}
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
    </Box>
  )
}
