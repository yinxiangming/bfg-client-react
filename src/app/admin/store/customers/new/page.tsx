'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Component Imports
import CustomerEditHeader from '@/views/admin/store/customers/edit/CustomerEditHeader'

// API Imports
import { createCustomer, type Customer } from '@/services/store'

export default function NewCustomerPage() {
  const router = useRouter()
  const t = useTranslations('admin')
  const [formData, setFormData] = useState({
    user_id: '',
    company_name: '',
    tax_number: '',
    credit_limit: '',
    is_active: true,
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.user_id) {
      setSnackbar({ open: true, message: t('customers.newPage.validation.userIdRequired'), severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const customerData: Partial<Customer> = {
        user_id: parseInt(formData.user_id),
        company_name: formData.company_name || undefined,
        tax_number: formData.tax_number || undefined,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : undefined,
        is_active: formData.is_active,
        notes: formData.notes || undefined
      }

      const newCustomer = await createCustomer(customerData)
      setSnackbar({ open: true, message: t('customers.newPage.snackbar.created'), severity: 'success' })
      setTimeout(() => {
        router.push(`/admin/store/customers/${newCustomer.id}`)
      }, 1000)
    } catch (error: any) {
      console.error('Failed to create customer', error)
      setSnackbar({ open: true, message: error.message || t('customers.newPage.snackbar.createFailed'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    router.push('/admin/store/customers')
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <CustomerEditHeader
            customer={{ id: 0, user_id: 0 } as Customer}
            onDelete={undefined}
            onResetPassword={undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 4 }}>
                {t('customers.newPage.card.title')}
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('customers.newPage.fields.userId.label')}
                    type='number'
                    value={formData.user_id}
                    onChange={(e) => handleChange('user_id', e.target.value)}
                    required
                    helperText={t('customers.newPage.fields.userId.helper')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('customers.newPage.fields.companyName.label')}
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={t('customers.newPage.fields.taxNumber.label')}
                    value={formData.tax_number}
                    onChange={(e) => handleChange('tax_number', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={t('customers.newPage.fields.creditLimit.label')}
                    type='number'
                    value={formData.credit_limit}
                    onChange={(e) => handleChange('credit_limit', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('customers.newPage.fields.notes.label')}
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                <Button variant='outlined' color='secondary' onClick={handleDiscard} disabled={saving}>
                  {t('customers.newPage.actions.discard')}
                </Button>
                <Button variant='contained' onClick={handleSave} disabled={saving}>
                  {saving ? t('customers.newPage.actions.creating') : t('customers.newPage.actions.createCustomer')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
