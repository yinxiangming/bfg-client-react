'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import TrackingEventEditDialog from './TrackingEventEditDialog'
import {
  getTrackingEvents,
  getTrackingEvent,
  createTrackingEvent,
  updateTrackingEvent,
  deleteTrackingEvent,
  type TrackingEvent,
  type TrackingEventPayload
} from '@/services/delivery'

const buildTrackingEventsSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.trackingEvents.tab.title'),
  columns: [
    { field: 'event_type', label: t('settings.delivery.trackingEvents.tab.columns.eventType'), type: 'string', sortable: true, link: 'edit' },
    { field: 'description', label: t('settings.delivery.trackingEvents.tab.columns.description'), type: 'string' },
    { field: 'location', label: t('settings.delivery.trackingEvents.tab.columns.location'), type: 'string' },
    { field: 'event_time', label: t('settings.delivery.trackingEvents.tab.columns.eventTime'), type: 'datetime', sortable: true },
    { field: 'created_at', label: t('settings.delivery.trackingEvents.tab.columns.created'), type: 'datetime', sortable: true }
  ],
  searchFields: ['event_type', 'description', 'location'],
  actions: [
    { id: 'add', label: t('settings.delivery.trackingEvents.tab.actions.newEvent'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.trackingEvents.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.trackingEvents.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.trackingEvents.tab.actions.confirmDelete')
    }
  ]
})

const TrackingEventsTab = () => {
  const t = useTranslations('admin')
  const trackingEventsSchema = useMemo(() => buildTrackingEventsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<TrackingEvent[]>({
    fetchFn: async () => {
      const result = await getTrackingEvents()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<TrackingEvent | null>(null)

  const handleActionClick = async (action: SchemaAction, item: TrackingEvent | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as TrackingEvent)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTrackingEvent((item as TrackingEvent).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.trackingEvents.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: TrackingEventPayload) => {
    try {
      if (selected) {
        await updateTrackingEvent(selected.id, payload)
      } else {
        await createTrackingEvent(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.trackingEvents.tab.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <SchemaTable
        schema={trackingEventsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getTrackingEvent(typeof id === 'string' ? parseInt(id) : id)}
      />
      <TrackingEventEditDialog
        open={editOpen}
        eventItem={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default TrackingEventsTab

