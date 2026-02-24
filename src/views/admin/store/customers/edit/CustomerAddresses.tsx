'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import DialogContentText from '@mui/material/DialogContentText'
import Snackbar from '@mui/material/Snackbar'

// Icon Imports
import Icon from '@/components/Icon'

// Type Imports
import { getCustomerAddresses, createAddress, updateAddress, deleteAddress, type Address } from '@/services/store'
import { apiFetch, bfgApi } from '@/utils/api'

type CustomerAddressesProps = {
  customerId: number
  onUpdate?: () => void
}

const CustomerAddresses = ({ customerId, onUpdate }: CustomerAddressesProps) => {
  const t = useTranslations('admin')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({})
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchAddresses()
  }, [customerId])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const data = await getCustomerAddresses(customerId)
      setAddresses(data)
    } catch (error) {
      console.error('Failed to fetch addresses', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address)
      setFormData(address)
    } else {
      setEditingAddress(null)
      setFormData({
        full_name: '',
        company: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        phone: '',
        email: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAddress(null)
    setFormData({})
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, {
          ...formData,
          customer: customerId
        })
      } else {
        await createAddress({
          ...formData,
          customer: customerId
        })
      }
      await fetchAddresses()
      if (onUpdate) {
        onUpdate()
      }
      handleCloseDialog()
      setSnackbar({ open: true, message: t('customers.addresses.snackbar.saved'), severity: 'success' })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.addresses.snackbar.saveFailed', { error: error.message }),
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (addressId: number) => {
    setPendingDeleteId(addressId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    setDeleteDialogOpen(false)
    try {
      await deleteAddress(pendingDeleteId)
      await fetchAddresses()
      if (onUpdate) {
        onUpdate()
      }
      setSnackbar({ open: true, message: t('customers.addresses.snackbar.deleted'), severity: 'success' })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.addresses.snackbar.deleteFailed', { error: error.message }),
        severity: 'error'
      })
    } finally {
      setPendingDeleteId(null)
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

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant='h6'>
              {t('customers.addresses.title', { count: addresses.length })}
            </Typography>
            <Button variant='contained' onClick={() => handleOpenDialog()}>
              {t('customers.addresses.actions.add')}
            </Button>
          </Box>
          {addresses.length > 0 ? (
            <Grid container spacing={3}>
              {addresses.map((address) => (
                <Grid size={{ xs: 12, md: 6 }} key={address.id}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          {address.is_default && (
                            <Chip label={t('customers.addresses.values.default')} color='primary' size='small' sx={{ mb: 1 }} />
                          )}
                          <Typography variant='subtitle1'>{address.full_name || t('customers.addresses.values.na')}</Typography>
                          {address.company && (
                            <Typography variant='body2' color='text.secondary'>
                              {address.company}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <IconButton size='small' onClick={() => handleOpenDialog(address)}>
                            <Icon icon='tabler:edit' />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleDelete(address.id)} color='error'>
                            <Icon icon='tabler:trash' />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant='body2'>
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                      </Typography>
                      <Typography variant='body2'>
                        {address.city}
                        {address.state && `, ${address.state}`}
                        {address.postal_code && ` ${address.postal_code}`}
                      </Typography>
                      {address.country && (
                        <Typography variant='body2'>{address.country}</Typography>
                      )}
                      {address.phone && (
                        <Typography variant='body2' sx={{ mt: 1 }}>
                          {t('customers.addresses.fields.phone.label')}: {address.phone}
                        </Typography>
                      )}
                      {address.email && (
                        <Typography variant='body2'>
                          {t('customers.addresses.fields.email.label')}: {address.email}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity='info'>{t('customers.addresses.empty')}</Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editingAddress ? t('customers.addresses.dialog.editTitle') : t('customers.addresses.dialog.addTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label={t('customers.addresses.fields.fullName.label')}
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('customers.addresses.fields.company.label')}
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('customers.addresses.fields.addressLine1.label')}
              value={formData.address_line1 || ''}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('customers.addresses.fields.addressLine2.label')}
              value={formData.address_line2 || ''}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.addresses.fields.city.label')}
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.addresses.fields.state.label')}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.addresses.fields.postalCode.label')}
                  value={formData.postal_code || ''}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('customers.addresses.fields.country.label')}
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label={t('customers.addresses.fields.phone.label')}
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('customers.addresses.fields.email.label')}
              type='email'
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('customers.addresses.actions.cancel')}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t('common.states.saving') : t('customers.addresses.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('customers.addresses.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.addresses.deleteDialog.message')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('customers.addresses.actions.cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
            {t('customers.addresses.actions.delete')}
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
    </>
  )
}

export default CustomerAddresses
