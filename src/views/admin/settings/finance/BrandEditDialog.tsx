'use client'

// React Imports
import { useEffect, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'

// Component Imports
import SchemaForm from '@/components/schema/SchemaForm'
import AddressSelectModal from '@/components/admin/AddressSelectModal'
import type { FormSchema } from '@/types/schema'
import type { Address } from '@/services/store'
import type { Brand, BrandPayload } from '@/services/finance'

type BrandFormData = Omit<BrandPayload, 'logo' | 'address_id'> & {
  logo?: File
}

type BrandEditDialogProps = {
  open: boolean
  brand: Brand | null
  onClose: () => void
  onSave: (data: BrandPayload) => Promise<void> | void
}

const buildBrandFormSchema = (t: any): FormSchema => ({
  title: t('settings.finance.brands.schema.title'),
  fields: [
    { field: 'name', label: t('settings.finance.brands.schema.name'), type: 'string', required: true },
    { field: 'logo', label: t('settings.finance.brands.schema.logo'), type: 'file', accept: 'image/*' },
    {
      field: 'tax_id',
      label: t('settings.finance.brands.schema.taxId'),
      type: 'string',
      placeholder: t('settings.finance.brands.schema.taxIdPlaceholder')
    },
    { field: 'registration_number', label: t('settings.finance.brands.schema.registrationNumber'), type: 'string' },
    {
      field: 'invoice_note',
      label: t('settings.finance.brands.schema.invoiceNote'),
      type: 'textarea',
      rows: 6,
      placeholder: t('settings.finance.brands.schema.invoiceNotePlaceholder')
    },
    { field: 'is_default', label: t('settings.finance.brands.schema.isDefault'), type: 'boolean', defaultValue: false }
  ]
})

const formatAddress = (address: Address) =>
  [
    address.company || address.full_name,
    address.address_line1,
    address.address_line2,
    address.city,
    address.postal_code,
    address.country
  ]
    .filter(Boolean)
    .join(', ')

const BrandEditDialog = ({ open, brand, onClose, onSave }: BrandEditDialogProps) => {
  const t = useTranslations('admin')
  const brandFormSchema = buildBrandFormSchema(t)
  const [address, setAddress] = useState<Address | null>(null)
  const [addressPickerOpen, setAddressPickerOpen] = useState(false)

  useEffect(() => {
    if (open) setAddress(brand?.address ?? null)
  }, [open, brand])

  const initialData: Partial<BrandFormData> = brand
    ? (({ logo: _logo, address: _address, ...rest }) => rest)(brand)
    : {
        name: '',
        tax_id: '',
        registration_number: '',
        invoice_note: '',
        is_default: false
      }

  const handleSubmit = async (data: Partial<BrandFormData>) => {
    const payload: BrandPayload = {
      name: data.name || '',
      logo: data.logo,
      // An empty value clears the address.
      address_id: address ? address.id : '',
      tax_id: data.tax_id || '',
      registration_number: data.registration_number || '',
      invoice_note: data.invoice_note || '',
      is_default: Boolean(data.is_default)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 6, pt: 6 }}>
          <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
            {t('settings.finance.brands.schema.address')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Typography variant='body2' color={address ? 'text.primary' : 'text.secondary'} sx={{ flex: 1 }}>
              {address ? formatAddress(address) : t('settings.finance.brands.schema.noAddress')}
            </Typography>
            {address && (
              <Button size='small' color='secondary' onClick={() => setAddress(null)}>
                {t('settings.finance.brands.schema.removeAddress')}
              </Button>
            )}
            <Button size='small' variant='outlined' onClick={() => setAddressPickerOpen(true)}>
              {t('settings.finance.brands.schema.chooseAddress')}
            </Button>
          </Box>
        </Box>
        <SchemaForm schema={brandFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
      <AddressSelectModal
        open={addressPickerOpen}
        scope='workspace'
        currentAddressId={address?.id}
        onClose={() => setAddressPickerOpen(false)}
        onSelect={selected => setAddress(selected)}
      />
    </Dialog>
  )
}

export default BrandEditDialog

