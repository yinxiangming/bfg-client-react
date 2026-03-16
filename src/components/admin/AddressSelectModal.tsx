'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

// API Imports
import { getCustomerAddresses, createAddress, updateAddress, type Address } from '@/services/store'
import { meApi } from '@/utils/meApi'

// Address autocomplete (Google Places)
import AddressAutocomplete from '@/components/storefront/AddressAutocomplete'

// Icon
import IconButton from '@mui/material/IconButton'

type AddressSelectModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (address: Address) => void
  customerId?: number
  currentAddressId?: number
  allowCreate?: boolean
}

const AddressSelectModal = ({
  open,
  onClose,
  onSelect,
  customerId,
  currentAddressId,
  allowCreate = true
}: AddressSelectModalProps) => {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(currentAddressId || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
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

  useEffect(() => {
    if (open && customerId) {
      fetchAddresses()
    }
  }, [open, customerId])

  useEffect(() => {
    if (open) {
      setSelectedAddressId(currentAddressId || null)
      setShowAddForm(false)
      setEditingAddress(null)
    }
  }, [open, currentAddressId])

  const fetchAddresses = async () => {
    if (!customerId) return

    setLoading(true)
    setError(null)
    try {
      const data = await getCustomerAddresses(customerId)
      setAddresses(data)
    } catch (err: any) {
      console.error('Failed to fetch addresses', err)
      setError(err.message || 'Failed to fetch addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedAddressId) {
      const address = addresses.find(a => a.id === selectedAddressId)
      if (address) {
        onSelect(address)
        onClose()
      }
    }
  }

  const handleAddressSelect = (components: { address: string; city: string; state: string; zip: string; country: string }) => {
    setNewAddress((prev) => ({
      ...prev,
      address_line1: components.address || prev.address_line1,
      city: components.city || prev.city,
      state: components.state || prev.state,
      postal_code: components.zip || prev.postal_code,
      country: components.country || prev.country
    }))
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setNewAddress({
      full_name: address.full_name ?? '',
      company: address.company ?? '',
      address_line1: address.address_line1 ?? '',
      address_line2: address.address_line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      postal_code: address.postal_code ?? '',
      country: address.country ?? '',
      phone: address.phone ?? '',
      email: address.email ?? ''
    })
  }

  const handleSaveEditAddress = async () => {
    if (!editingAddress?.id) return
    setLoading(true)
    setError(null)
    try {
      await updateAddress(editingAddress.id, {
        full_name: newAddress.full_name || '',
        phone: newAddress.phone || '',
        email: newAddress.email,
        company: newAddress.company,
        address_line1: newAddress.address_line1 || '',
        address_line2: newAddress.address_line2,
        city: newAddress.city || '',
        state: newAddress.state,
        postal_code: newAddress.postal_code || '',
        country: newAddress.country || ''
      })
      await fetchAddresses()
      setEditingAddress(null)
      setNewAddress({
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
    } catch (err: any) {
      setError(err.message || 'Failed to update address')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAddress = async () => {
    if (!customerId) return

    setLoading(true)
    setError(null)
    try {
      // Create address via meApi (which will associate it with the customer)
      const created = await meApi.createAddress({
        full_name: newAddress.full_name || '',
        phone: newAddress.phone || '',
        email: newAddress.email,
        address_line1: newAddress.address_line1 || '',
        address_line2: newAddress.address_line2,
        city: newAddress.city || '',
        state: newAddress.state,
        postal_code: newAddress.postal_code || '',
        country: newAddress.country || '',
        is_default: false
      })

      // Refresh addresses list
      await fetchAddresses()
      
      // Select the newly created address
      setSelectedAddressId(created.id)
      setShowAddForm(false)
      
      // Reset form
      setNewAddress({
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
    } catch (err: any) {
      console.error('Failed to create address', err)
      setError(err.message || 'Failed to create address')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: Address) => {
    const parts = [
      address.full_name,
      address.company,
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean)

    return parts.join(', ')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Select Address</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !addresses.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!showAddForm && !editingAddress ? (
              <>
                {addresses.length > 0 ? (
                  <FormControl component='fieldset' fullWidth>
                    <RadioGroup
                      value={selectedAddressId || ''}
                      onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                    >
                      {addresses.map((address) => (
                        <Box
                          key={address.id}
                          sx={{
                            mb: 2,
                            p: 2,
                            border: selectedAddressId === address.id ? '2px solid' : '1px solid',
                            borderColor: selectedAddressId === address.id ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1
                          }}
                        >
                          <FormControlLabel
                            value={address.id}
                            control={<Radio />}
                            label={
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant='body1' fontWeight={500}>
                                    {address.full_name || 'Unnamed Address'}
                                  </Typography>
                                  {address.is_default && (
                                    <Typography variant='caption' color='primary'>
                                      (Default)
                                    </Typography>
                                  )}
                                </Box>
                                <Typography variant='body2' color='text.secondary'>
                                  {formatAddress(address)}
                                </Typography>
                                {address.phone && (
                                  <Typography variant='body2' color='text.secondary'>
                                    Phone: {address.phone}
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{ flex: 1, m: 0 }}
                          />
                          {selectedAddressId === address.id && (
                            <IconButton
                              size='small'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAddress(address)
                              }}
                              title='Edit address'
                              sx={{ flexShrink: 0 }}
                            >
                              <i className='tabler-edit' style={{ fontSize: 20 }} />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                    </RadioGroup>
                  </FormControl>
                ) : (
                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    No addresses found for this customer.
                  </Typography>
                )}

                {allowCreate && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant='outlined'
                      fullWidth
                      onClick={() => setShowAddForm(true)}
                      disabled={loading}
                    >
                      + Add New Address
                    </Button>
                  </>
                )}
              </>
            ) : editingAddress ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant='h6'>Edit Address</Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Full Name *</Typography>
                      <input
                        type='text'
                        value={newAddress.full_name || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Phone *</Typography>
                      <input
                        type='text'
                        value={newAddress.phone || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Company</Typography>
                    <input
                      type='text'
                      value={newAddress.company || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Address Line 1 *</Typography>
                    <AddressAutocomplete
                      value={newAddress.address_line1 || ''}
                      onChange={(v) => setNewAddress({ ...newAddress, address_line1: v })}
                      onAddressSelect={handleAddressSelect}
                      placeholder='Start typing address...'
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Address Line 2</Typography>
                    <input
                      type='text'
                      value={newAddress.address_line2 || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>City *</Typography>
                      <input
                        type='text'
                        value={newAddress.city || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>State</Typography>
                      <input
                        type='text'
                        value={newAddress.state || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Postal Code *</Typography>
                      <input
                        type='text'
                        value={newAddress.postal_code || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Country *</Typography>
                      <input
                        type='text'
                        value={newAddress.country || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Email</Typography>
                    <input
                      type='email'
                      value={newAddress.email || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      setEditingAddress(null)
                      setNewAddress({
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
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleSaveEditAddress}
                    disabled={
                      loading ||
                      !newAddress.full_name ||
                      !newAddress.address_line1 ||
                      !newAddress.city ||
                      !newAddress.postal_code ||
                      !newAddress.country ||
                      !newAddress.phone
                    }
                  >
                    {loading ? <CircularProgress size={20} /> : 'Save'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant='h6'>Add New Address</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Full Name *</Typography>
                      <input
                        type='text'
                        value={newAddress.full_name || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Phone *</Typography>
                      <input
                        type='text'
                        value={newAddress.phone || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Company</Typography>
                    <input
                      type='text'
                      value={newAddress.company || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Address Line 1 *</Typography>
                    <AddressAutocomplete
                      value={newAddress.address_line1 || ''}
                      onChange={(v) => setNewAddress({ ...newAddress, address_line1: v })}
                      onAddressSelect={handleAddressSelect}
                      placeholder='Start typing address...'
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Address Line 2</Typography>
                    <input
                      type='text'
                      value={newAddress.address_line2 || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>City *</Typography>
                      <input
                        type='text'
                        value={newAddress.city || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>State</Typography>
                      <input
                        type='text'
                        value={newAddress.state || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Postal Code *</Typography>
                      <input
                        type='text'
                        value={newAddress.postal_code || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant='body2' sx={{ mb: 1 }}>Country *</Typography>
                      <input
                        type='text'
                        value={newAddress.country || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>Email</Typography>
                    <input
                      type='email'
                      value={newAddress.email || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAddress({
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
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleCreateAddress}
                    disabled={
                      loading ||
                      !newAddress.full_name ||
                      !newAddress.address_line1 ||
                      !newAddress.city ||
                      !newAddress.postal_code ||
                      !newAddress.country ||
                      !newAddress.phone
                    }
                  >
                    {loading ? <CircularProgress size={20} /> : 'Create Address'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSelect}
          disabled={!selectedAddressId || loading || showAddForm || !!editingAddress}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddressSelectModal
