'use client'

// React Imports
import { useState } from 'react'

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
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

// Type Imports
import type { Customer } from '@/services/store'
import { updateCustomer } from '@/services/store'
import { updateUser } from '@/services/settings'

type CustomerBasicInfoProps = {
  customer: Customer
  onUpdate?: () => void
}

const CustomerBasicInfo = ({ customer, onUpdate }: CustomerBasicInfoProps) => {
  const t = useTranslations('admin')
  const [formData, setFormData] = useState({
    company_name: customer.company_name || '',
    tax_number: customer.tax_number || '',
    credit_limit: customer.credit_limit || 0,
    notes: customer.notes || '',
    is_active: customer.is_active ?? true
  })
  const [userFormData, setUserFormData] = useState({
    email: customer.user?.email || customer.user_email || '',
    first_name: customer.user?.first_name || '',
    last_name: customer.user?.last_name || '',
    phone: customer.user?.phone || ''
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

  const handleUserChange = (field: string, value: any) => {
    setUserFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update customer information
      await updateCustomer(customer.id, formData)
      
      // Update user information if user exists
      if (customer.user?.id) {
        await updateUser(customer.user.id, userFormData)
      }
      
      if (onUpdate) {
        onUpdate()
      }
      setSnackbar({ open: true, message: t('customers.basicInfo.snackbar.updated'), severity: 'success' })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.basicInfo.snackbar.updateFailed', { error: error.message }),
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant='body2' color='text.secondary'>
                      {t('customers.basicInfo.fields.status.label')}:{' '}
                      <Typography component='span' sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {formData.is_active ? t('customers.values.active') : t('customers.values.inactive')}
                      </Typography>
                    </Typography>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.email.label')}
                  type='email'
                  value={userFormData.email}
                  onChange={(e) => handleUserChange('email', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.firstName.label')}
                  value={userFormData.first_name}
                  onChange={(e) => handleUserChange('first_name', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.lastName.label')}
                  value={userFormData.last_name}
                  onChange={(e) => handleUserChange('last_name', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.phone.label')}
                  value={userFormData.phone}
                  onChange={(e) => handleUserChange('phone', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.notes.label')}
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 4 }}>
              {t('customers.basicInfo.sidebar.title')}
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.companyName.label')}
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.taxNumber.label')}
                  value={formData.tax_number}
                  onChange={(e) => handleChange('tax_number', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('customers.basicInfo.fields.creditLimit.label')}
                  type='number'
                  value={formData.credit_limit}
                  onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    {t('customers.basicInfo.fields.verified.label')}
                  </Typography>
                  <Typography variant='body1'>
                    {customer.is_verified ? t('customers.values.yes') : t('customers.values.no')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t('common.states.saving') : t('customers.basicInfo.actions.saveChanges')}
          </Button>
        </Box>
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
    </Grid>
  )
}

export default CustomerBasicInfo
