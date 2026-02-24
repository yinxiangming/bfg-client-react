'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { TrackingEvent, TrackingEventPayload } from '@/services/delivery'
import { bfgApi } from '@/utils/api'

type TrackingEventEditDialogProps = {
  open: boolean
  eventItem: TrackingEvent | null
  onClose: () => void
  onSave: (data: TrackingEventPayload) => Promise<void> | void
}

const buildTrackingEventFormSchema = (t: any): FormSchema => ({
  title: t('settings.delivery.trackingEvents.editDialog.title'),
  fields: [
    { field: 'event_type', label: t('settings.delivery.trackingEvents.editDialog.fields.eventType'), type: 'string', required: true },
    { field: 'description', label: t('settings.delivery.trackingEvents.editDialog.fields.description'), type: 'textarea' },
    { field: 'location', label: t('settings.delivery.trackingEvents.editDialog.fields.location'), type: 'string' },
    { field: 'event_time', label: t('settings.delivery.trackingEvents.editDialog.fields.eventTime'), type: 'datetime', required: true },
    {
      field: 'consignment',
      label: t('settings.delivery.trackingEvents.editDialog.fields.consignment'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.consignments(),
      optionLabelTemplate: '{{consignment_number}}',
      searchable: true,
      searchParam: 'q'
    }
  ]
})

const TrackingEventEditDialog = ({ open, eventItem, onClose, onSave }: TrackingEventEditDialogProps) => {
  const t = useTranslations('admin')
  const trackingEventFormSchema = useMemo(() => buildTrackingEventFormSchema(t), [t])

  const initialData: Partial<TrackingEventPayload> = eventItem
    ? {
        event_type: eventItem.event_type,
        description: eventItem.description,
        location: eventItem.location,
        event_time: eventItem.event_time,
        consignment: eventItem.consignment,
        package: eventItem.package
      }
    : {
        event_type: '',
        event_time: new Date().toISOString()
      }

  const handleSubmit = async (data: Partial<TrackingEventPayload>) => {
    const payload: TrackingEventPayload = {
      event_type: data.event_type || '',
      description: data.description,
      location: data.location,
      event_time: data.event_time || new Date().toISOString(),
      consignment: data.consignment ? Number(data.consignment) : undefined,
      package: data.package ? Number(data.package) : undefined
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
          schema={trackingEventFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default TrackingEventEditDialog

