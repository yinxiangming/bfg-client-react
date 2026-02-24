'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'

import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'
import type { ListSchema, FormSchema, FormField } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'

import type { BookingTimeSlot, BookingSlotType } from '@/services/webBooking'
import {
  getBookingTimeSlots,
  getBookingTimeSlot,
  createBookingTimeSlot,
  updateBookingTimeSlot,
  deleteBookingTimeSlot
} from '@/services/webBooking'

const DEFAULT_SLOT_TYPE = 'dropoff'

function toDateInputValue(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().slice(0, 10)
}

function toTimeInputValue(timeStr: string): string {
  if (!timeStr) return '09:00'
  const part = String(timeStr).slice(0, 5)
  return part.length === 5 ? part : '09:00'
}

const emptyInitialData: Partial<BookingTimeSlot> = {
  slot_type: DEFAULT_SLOT_TYPE as BookingSlotType,
  date: toDateInputValue(new Date().toISOString()),
  start_time: '09:00',
  end_time: '17:00',
  max_bookings: 5,
  is_active: true,
  name: '',
  notes: ''
}

export default function TimeSlotsPage() {
  const t = useTranslations('admin')
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<BookingTimeSlot | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const listSchema: ListSchema = useMemo(
    () => ({
      title: t('settings.web.timeSlots.title'),
      columns: [
        { field: 'date', label: t('settings.web.timeSlots.columns.date'), type: 'date', sortable: true },
        {
          field: 'start_time',
          label: t('settings.web.timeSlots.columns.time'),
          type: 'string',
          render: (_, row: BookingTimeSlot) =>
            `${toTimeInputValue(row.start_time)} – ${toTimeInputValue(row.end_time)}`
        },
        {
          field: 'max_bookings',
          label: t('settings.web.timeSlots.columns.capacity'),
          type: 'number',
          render: (_, row: BookingTimeSlot) =>
            `${row.current_bookings ?? 0} / ${row.max_bookings ?? 0}`
        },
        { field: 'name', label: t('settings.web.timeSlots.columns.name'), type: 'string' },
        { field: 'is_active', label: t('settings.web.timeSlots.columns.active'), type: 'select', sortable: true }
      ],
      actions: [
        { id: 'add', label: t('settings.web.timeSlots.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
        { id: 'edit', label: t('settings.web.timeSlots.actions.edit'), type: 'secondary', scope: 'row' },
        {
          id: 'delete',
          label: t('settings.web.timeSlots.actions.delete'),
          type: 'danger',
          scope: 'row',
          confirm: t('settings.web.timeSlots.actions.confirmDelete')
        }
      ]
    }),
    [t]
  )

  const formSchema: FormSchema = useMemo(
    () => ({
      title: t('settings.web.timeSlots.formTitle'),
      fields: [
        { field: 'date', label: t('settings.web.timeSlots.fields.date'), type: 'date', required: true },
        { field: 'start_time', label: t('settings.web.timeSlots.fields.startTime'), type: 'string', required: true },
        { field: 'end_time', label: t('settings.web.timeSlots.fields.endTime'), type: 'string', required: true },
        {
          field: 'max_bookings',
          label: t('settings.web.timeSlots.fields.maxBookings'),
          type: 'number',
          required: true,
          defaultValue: 5,
          validation: { min: 1 }
        },
        {
          field: 'name',
          label: t('settings.web.timeSlots.fields.nameOptional'),
          type: 'string',
          placeholder: t('settings.web.timeSlots.fields.namePlaceholder')
        },
        { field: 'notes', label: t('settings.web.timeSlots.fields.notes'), type: 'textarea', rows: 2 },
        { field: 'is_active', label: t('settings.web.timeSlots.fields.active'), type: 'boolean', defaultValue: true }
      ]
    }),
    [t]
  )

  const { data, loading, error, refetch } = useApiData<BookingTimeSlot[]>({
    fetchFn: async () => {
      const res = await getBookingTimeSlots({ slot_type: DEFAULT_SLOT_TYPE })
      return res.results ?? (res as unknown as BookingTimeSlot[]) ?? []
    }
  })

  const statusColors = useMemo(
    () =>
      ({
        true: 'success' as const,
        false: 'default' as const,
        yes: 'success' as const,
        no: 'default' as const
      }),
    []
  )

  const handleActionClick = async (
    action: { id: string },
    item: BookingTimeSlot | Record<string, never>
  ) => {
    if (action.id === 'add') {
      setSelected(null)
      setSubmitError(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as BookingTimeSlot)
      setSubmitError(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteBookingTimeSlot((item as BookingTimeSlot).id)
        await refetch()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('settings.web.timeSlots.errors.deleteFailed'))
      }
    }
  }

  const handleSave = async (payload: Partial<BookingTimeSlot>) => {
    setSubmitError(null)
    try {
      const body: Partial<BookingTimeSlot> = {
        slot_type: DEFAULT_SLOT_TYPE as BookingSlotType,
        date: payload.date,
        start_time: payload.start_time ?? '09:00',
        end_time: payload.end_time ?? '17:00',
        max_bookings: payload.max_bookings ?? 5,
        is_active: payload.is_active ?? true,
        name: payload.name ?? '',
        notes: payload.notes ?? ''
      }
      if (selected) {
        await updateBookingTimeSlot(selected.id, body)
      } else {
        await createBookingTimeSlot(body)
      }
      setEditOpen(false)
      await refetch()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('settings.web.timeSlots.errors.saveFailed'))
    }
  }

  const initialData: Partial<BookingTimeSlot> = selected
    ? {
        ...selected,
        date: toDateInputValue(selected.date),
        start_time: toTimeInputValue(selected.start_time),
        end_time: toTimeInputValue(selected.end_time)
      }
    : emptyInitialData

  const customFieldRenderer = (
    field: FormField,
    value: string,
    onChange: (v: string) => void,
    error?: string
  ) => {
    if (field.field === 'start_time' || field.field === 'end_time') {
      return (
        <TextField
          fullWidth
          type="time"
          label={field.label}
          value={value || (field.field === 'start_time' ? '09:00' : '17:00')}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          error={!!error}
          helperText={error}
          InputLabelProps={{ shrink: true }}
        />
      )
    }
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => {}}>
        {error}
      </Alert>
    )
  }

  return (
    <>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      <SchemaTable
        schema={listSchema}
        data={data ?? []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) =>
          getBookingTimeSlot(typeof id === 'string' ? parseInt(id, 10) : id)
        }
        statusColors={statusColors}
      />
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent
          sx={{ p: 0, '& .MuiCard-root': { boxShadow: 'none' }, '& .MuiCardContent-root': { p: 4 } }}
        >
          <SchemaForm
            schema={formSchema}
            initialData={initialData}
            onSubmit={handleSave}
            onCancel={() => setEditOpen(false)}
            customFieldRenderer={customFieldRenderer}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
