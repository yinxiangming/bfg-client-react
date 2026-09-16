'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'

// Component Imports
import CustomTextField from '@components/ui/TextField'
import AddressLookupField from '@/components/ui/AddressLookupField'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { resolvedAddressFields } from '@/hooks/useAddressLookup'
import type { ResolvedAddress } from '@/services/geo'

interface Address {
  id: number
  full_name: string
  phone: string
  email?: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  is_default: boolean
}

type AddressesProps = {
  registerOpenHandler?: (fn: () => void) => void
}

const Addresses = ({ registerOpenHandler }: AddressesProps) => {
  const t = useTranslations('account.addresses')

  // States
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'error'
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [userInfo, setUserInfo] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  })

  // Fetch addresses and user info
  useEffect(() => {
    fetchAddresses()
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const data = await meApi.getMe()
      setUserInfo({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || ''
      })
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  useEffect(() => {
    if (registerOpenHandler) {
      registerOpenHandler(() => handleOpenDialog())
    }
  }, [registerOpenHandler])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getAddresses()
      const data = response.results || response.data || []
      setAddresses(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  // A suggestion is picked for the whole address, not just the street line, so the
  // rest of the form follows it.
  const handleAddressResolved = (resolved: ResolvedAddress) => {
    setFormData(prev => ({ ...prev, ...resolvedAddressFields(resolved) }))
  }

  const handleOpenDialog = async (address?: Address) => {
    if (address) {
      setEditingId(address.id)
      setFormData({
        full_name: address.full_name || '',
        phone: address.phone || '',
        email: address.email || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        country: address.country || '',
        is_default: address.is_default || false
      })
    } else {
      setEditingId(null)
      // Fetch user info if not already loaded
      let currentUserInfo = userInfo
      if (!currentUserInfo) {
        try {
          const data = await meApi.getMe()
          currentUserInfo = {
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || ''
          }
          setUserInfo(currentUserInfo)
        } catch (err) {
          console.error('Failed to fetch user info:', err)
        }
      }
      // Auto-fill name and email for new address
      const fullName = currentUserInfo
        ? [currentUserInfo.first_name, currentUserInfo.last_name].filter(Boolean).join(' ').trim()
        : ''
      setFormData({
        full_name: fullName,
        phone: '',
        email: currentUserInfo?.email || '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (editingId) {
        await meApi.updateAddress(editingId, formData)
      } else {
        await meApi.createAddress(formData)
      }

      await fetchAddresses()
      setSuccessMessage(t('addressSaved'))
      setTimeout(() => setSuccessMessage(null), 3000)
      handleCloseDialog()
    } catch (err: any) {
      setError(err.message || t('failedSave'))
      setSnackbar({ open: true, message: err.message || t('failedSave'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      setError(null)
      await meApi.deleteAddress(deletingId)
      await fetchAddresses()
      setSuccessMessage(t('addressDeleted'))
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || t('failedDelete'))
      setSnackbar({ open: true, message: err.message || t('failedDelete'), severity: 'error' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDeletingId(null)
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card
          variant='outlined'
          sx={{
            borderRadius: 2,
            boxShadow: 'none',
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <CardContent sx={{ pt: 1.5, pb: 2 }}>
            {error && (
              <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert severity='success' className='mbe-4' onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}
            {loading ? (
              <Typography>{t('loading')}</Typography>
            ) : addresses.length === 0 ? (
              <Box className='text-center py-8'>
                <Typography variant='body1' className='mbe-4'>
                  {t('noAddresses')}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {t('addFirstAddress')}
                </Typography>
                <Button variant='contained' onClick={() => handleOpenDialog()}>
                  {t('addAddress')}
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {addresses.map(address => (
                  <Grid size={{ xs: 12, md: 6 }} key={address.id}>
                    <Card
                      variant='outlined'
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: theme => `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.25,
                          height: '100%',
                          position: 'relative'
                        }}
                      >
                        <Box className='flex justify-between items-start gap-2'>
                          <Box className='flex items-center gap-2' sx={{ flex: 1 }}>
                            <Typography variant='h6' fontWeight={700}>
                              {address.full_name}
                            </Typography>
                            {address.is_default && (
                              <Chip
                                label={t('default')}
                                color='primary'
                                size='small'
                                sx={{ borderRadius: 1.5, fontWeight: 600 }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                          {address.address_line1}
                        </Typography>
                        {address.address_line2 && (
                          <Typography variant='body2' color='text.secondary'>
                            {address.address_line2}
                          </Typography>
                        )}
                        <Typography variant='body2' color='text.secondary'>
                          {address.city}
                          {address.state ? `, ${address.state}` : ''} {address.postal_code}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {address.country}
                        </Typography>
                        {address.phone && (
                          <Typography variant='body2' color='text.secondary'>
                            {t('phone')}: {address.phone}
                          </Typography>
                        )}
                        {address.email && (
                          <Typography variant='body2' color='text.secondary'>
                            {t('email')}: {address.email}
                          </Typography>
                        )}
                        <Box className='flex gap-2 mts-2' sx={{ mt: 'auto', pt: 1 }}>
                          <Button
                            size='small'
                            variant='outlined'
                            color='primary'
                            onClick={() => handleOpenDialog(address)}
                            sx={{ px: 1.5, py: 0.5, fontWeight: 600, textTransform: 'uppercase', minWidth: 0 }}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            size='small'
                            variant='outlined'
                            color='error'
                            onClick={() => handleDeleteClick(address.id)}
                            sx={{ px: 1.5, py: 0.5, fontWeight: 600, textTransform: 'uppercase', ml: 0.5, minWidth: 0 }}
                          >
                            {t('delete')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogTitle>{editingId ? t('editAddress') : t('addAddress')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mts-2'>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t('fullName')}
                value={formData.full_name}
                onChange={e => handleFormChange('full_name', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('phone')}
                value={formData.phone}
                onChange={e => handleFormChange('phone', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('email')}
                type='email'
                value={formData.email}
                onChange={e => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <AddressLookupField
                component={TextField}
                label={t('addressLine1')}
                value={formData.address_line1}
                onChange={value => handleFormChange('address_line1', value)}
                onResolved={handleAddressResolved}
                placeholder={t('addressLine1Placeholder')}
                required
                helperText={t('addressLine1Helper')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t('addressLine2')}
                value={formData.address_line2}
                onChange={e => handleFormChange('address_line2', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('city')}
                value={formData.city}
                onChange={e => handleFormChange('city', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('state')}
                value={formData.state}
                onChange={e => handleFormChange('state', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('postalCode')}
                value={formData.postal_code}
                onChange={e => handleFormChange('postal_code', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label={t('country')}
                value={formData.country}
                onChange={e => handleFormChange('country', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_default}
                    onChange={e => handleFormChange('is_default', e.target.checked)}
                  />
                }
                label={t('isDefault')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t('deleteAddress')}</DialogTitle>
        <DialogContent>
          <Typography>{t('deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
          <Button variant='contained' color='error' onClick={handleDeleteConfirm}>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default Addresses
