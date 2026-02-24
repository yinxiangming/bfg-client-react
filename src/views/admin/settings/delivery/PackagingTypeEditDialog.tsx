'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { PackagingType, PackagingTypePayload } from '@/services/delivery'

type PackagingTypeEditDialogProps = {
  open: boolean
  packagingType: PackagingType | null
  onClose: () => void
  onSave: (data: PackagingTypePayload) => Promise<void> | void
}

const buildPackagingTypeFormSchema = (t: any): FormSchema => ({
  title: t('settings.delivery.packagingTypes.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.packagingTypes.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.packagingTypes.editDialog.fields.code'), type: 'string' },
    { field: 'description', label: t('settings.delivery.packagingTypes.editDialog.fields.description'), type: 'textarea' },
    { field: 'order', label: t('settings.delivery.packagingTypes.editDialog.fields.order'), type: 'number', defaultValue: 0 },
    {
      field: 'is_active',
      label: t('settings.delivery.packagingTypes.editDialog.fields.active'),
      type: 'boolean',
      defaultValue: true,
      newline: true
    }
  ]
})

const PackagingTypeEditDialog = ({ open, packagingType, onClose, onSave }: PackagingTypeEditDialogProps) => {
  const t = useTranslations('admin')
  const packagingTypeFormSchema = useMemo(() => buildPackagingTypeFormSchema(t), [t])

  const initialData: Partial<PackagingTypePayload> = packagingType
    ? {
        name: packagingType.name,
        code: packagingType.code,
        description: packagingType.description,
        order: packagingType.order,
        is_active: packagingType.is_active
      }
    : {
        name: '',
        code: '',
        description: '',
        order: 0,
        is_active: true
      }

  const handleSubmit = async (data: Partial<PackagingTypePayload>) => {
    const payload: PackagingTypePayload = {
      name: data.name || '',
      code: data.code,
      description: data.description,
      order: Number(data.order ?? 0),
      is_active: Boolean(data.is_active)
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
        <SchemaForm
          schema={packagingTypeFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default PackagingTypeEditDialog

