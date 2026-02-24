'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Store, StorePayload } from '@/services/store'
import { bfgApi } from '@/utils/api'

type StoreEditDialogProps = {
  open: boolean
  store: Store | null
  onClose: () => void
  onSave: (data: StorePayload) => Promise<void> | void
}

const buildStoreFormSchema = (t: any): FormSchema => ({
  title: t('settings.store.stores.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.store.stores.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.store.stores.editDialog.fields.code'), type: 'string', required: true },
    { field: 'description', label: t('settings.store.stores.editDialog.fields.description'), type: 'textarea', rows: 3 },
    {
      field: 'warehouses',
      label: t('settings.store.stores.editDialog.fields.warehouses'),
      type: 'multiselect',
      optionsSource: 'api',
      optionsApi: bfgApi.warehouses(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'is_active', label: t('settings.store.stores.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const StoreEditDialog = ({ open, store, onClose, onSave }: StoreEditDialogProps) => {
  const t = useTranslations('admin')
  const storeFormSchema = useMemo(() => buildStoreFormSchema(t), [t])

  const initialData: Partial<StorePayload> = store
    ? {
        name: store.name,
        code: store.code || '',
        description: store.description || '',
        warehouses: store.warehouses?.map(w => w.id) || [],
        is_active: store.is_active
      }
    : {
        name: '',
        code: '',
        description: '',
        warehouses: [],
        is_active: true
      }

  const handleSubmit = async (data: Partial<StorePayload>) => {
    const payload: StorePayload = {
      name: data.name || '',
      code: data.code || '',
      description: data.description,
      warehouses: data.warehouses,
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={storeFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default StoreEditDialog

