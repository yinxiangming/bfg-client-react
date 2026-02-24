'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { FreightStatus, FreightStatusPayload } from '@/services/delivery'

type FreightStatusEditDialogProps = {
  open: boolean
  statusItem: FreightStatus | null
  onClose: () => void
  onSave: (data: FreightStatusPayload) => Promise<void> | void
}

const buildFreightStatusFormSchema = (t: any): FormSchema => ({
  title: t('settings.delivery.freightStatuses.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.freightStatuses.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.freightStatuses.editDialog.fields.code'), type: 'string', required: true },
    { field: 'type', label: t('settings.delivery.freightStatuses.editDialog.fields.type'), type: 'string', required: true },
    { field: 'state', label: t('settings.delivery.freightStatuses.editDialog.fields.state'), type: 'string', required: true },
    { field: 'description', label: t('settings.delivery.freightStatuses.editDialog.fields.description'), type: 'textarea' },
    { field: 'color', label: t('settings.delivery.freightStatuses.editDialog.fields.color'), type: 'color' },
    { field: 'order', label: t('settings.delivery.freightStatuses.editDialog.fields.order'), type: 'number', defaultValue: 0 },
    { field: 'is_active', label: t('settings.delivery.freightStatuses.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true }
  ]
})

const FreightStatusEditDialog = ({ open, statusItem, onClose, onSave }: FreightStatusEditDialogProps) => {
  const t = useTranslations('admin')
  const freightStatusFormSchema = useMemo(() => buildFreightStatusFormSchema(t), [t])

  const initialData: Partial<FreightStatusPayload> = statusItem
    ? {
        name: statusItem.name,
        code: statusItem.code,
        type: statusItem.type,
        state: statusItem.state,
        description: statusItem.description,
        color: statusItem.color,
        order: statusItem.order,
        is_active: statusItem.is_active
      }
    : {
        name: '',
        code: '',
        type: '',
        state: '',
        order: 0,
        is_active: true
      }

  const handleSubmit = async (data: Partial<FreightStatusPayload>) => {
    const payload: FreightStatusPayload = {
      name: data.name || '',
      code: data.code || '',
      type: data.type || '',
      state: data.state || '',
      description: data.description,
      color: data.color,
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
          schema={freightStatusFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default FreightStatusEditDialog

