'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

// Component Imports
import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Brand, BrandPayload } from '@/services/finance'

type BrandFormData = Omit<BrandPayload, 'logo'> & {
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
    { field: 'address_id', label: t('settings.finance.brands.schema.addressId'), type: 'number' },
    { field: 'tax_id', label: t('settings.finance.brands.schema.taxId'), type: 'string' },
    { field: 'registration_number', label: t('settings.finance.brands.schema.registrationNumber'), type: 'string' },
    { 
      field: 'invoice_note', 
      label: t('settings.finance.brands.schema.invoiceNote'), 
      type: 'textarea', 
      rows: 6,
      placeholder: t('settings.finance.brands.schema.invoiceNotePlaceholder')
    },
    { field: 'is_default', label: t('settings.finance.brands.schema.isDefault'), type: 'boolean', defaultValue: false },
    { field: 'is_active', label: t('settings.finance.brands.schema.isActive'), type: 'boolean', defaultValue: true }
  ]
})

const BrandEditDialog = ({ open, brand, onClose, onSave }: BrandEditDialogProps) => {
  const t = useTranslations('admin')
  const brandFormSchema = buildBrandFormSchema(t)
  const initialData: Partial<BrandFormData> = brand
    ? (({ logo: _logo, ...rest }) => rest)(brand)
    : {
        name: '',
        tax_id: '',
        registration_number: '',
        invoice_note: '',
        is_default: false,
        is_active: true
      }

  const handleSubmit = async (data: Partial<BrandFormData>) => {
    const payload: BrandPayload = {
      name: data.name || '',
      logo: data.logo,
      address_id: data.address_id ? Number(data.address_id) : undefined,
      tax_id: data.tax_id || '',
      registration_number: data.registration_number || '',
      invoice_note: data.invoice_note || '',
      is_default: Boolean(data.is_default),
      is_active: data.is_active ?? true
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={brandFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default BrandEditDialog

