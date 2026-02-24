'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'
import type { ListSchema, FormSchema } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'

import {
  getBookings,
  getBooking,
  updateBooking,
  confirmBooking,
  cancelBooking
} from '../../services'
import type { Booking, BookingStatus } from '../../types'

function formatTime(t?: string | null): string {
  if (!t) return ''
  return String(t).slice(0, 5)
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

function slotDisplay(b: Booking): string {
  if (b.slot_date && (b.slot_start_time || b.slot_end_time)) {
    return `${formatDate(b.slot_date)} ${formatTime(b.slot_start_time)}–${formatTime(b.slot_end_time)}`
  }
  return formatDate(b.created_at) || `#${b.timeslot}`
}

function customerDisplay(b: Booking, t: (key: string, values?: Record<string, number>) => string): string {
  if (b.name) return b.name
  if (b.email) return b.email
  if (b.customer) return t('customerId', { id: b.customer })
  return '—'
}

const statusColors: Record<BookingStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  confirmed: 'primary',
  cancelled: 'default',
  completed: 'success',
  no_show: 'error'
}

export default function ResaleBookingsPage() {
  const t = useTranslations('resale')
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const listSchema: ListSchema = useMemo(
    () => ({
      title: t('admin.bookings.title'),
      columns: [
        {
          field: 'slot_date',
          label: t('admin.bookings.dateTime'),
          type: 'string',
          sortable: true,
          render: (_, row: Booking) => slotDisplay(row)
        },
        {
          field: 'name',
          label: t('admin.bookings.customer'),
          type: 'string',
          render: (_, row: Booking) => customerDisplay(row, t)
        },
        { field: 'slot_type', label: t('admin.bookings.type'), type: 'string', sortable: true },
        { field: 'status', label: t('admin.bookings.status'), type: 'select', sortable: true },
        { field: 'created_at', label: t('admin.bookings.created'), type: 'date', sortable: true }
      ],
      actions: [
        { id: 'edit', label: t('admin.bookings.edit'), type: 'secondary', scope: 'row' },
        {
          id: 'confirm',
          label: t('admin.bookings.confirm'),
          type: 'success',
          scope: 'row',
          confirm: t('admin.bookings.confirmBooking')
        },
        {
          id: 'cancel',
          label: t('admin.bookings.cancel'),
          type: 'danger',
          scope: 'row',
          confirm: t('admin.bookings.cancelBooking')
        }
      ]
    }),
    [t]
  )

  const statusOptions = useMemo(
    () => [
      { value: 'pending', label: t('status.booking.pending') },
      { value: 'confirmed', label: t('status.booking.confirmed') },
      { value: 'cancelled', label: t('status.booking.cancelled') },
      { value: 'completed', label: t('status.booking.completed') },
      { value: 'no_show', label: t('admin.bookings.statusNoShow') }
    ],
    [t]
  )

  const formSchema: FormSchema = useMemo(
    () => ({
      title: t('admin.bookings.formTitle'),
      fields: [
        {
          field: 'status',
          label: t('admin.bookings.status'),
          type: 'select',
          required: true,
          options: statusOptions
        },
        { field: 'notes', label: t('admin.bookings.notes'), type: 'textarea', rows: 2 },
        { field: 'admin_notes', label: t('admin.bookings.adminNotes'), type: 'textarea', rows: 2 }
      ]
    }),
    [t, statusOptions]
  )

  const { data, loading, error, refetch } = useApiData<Booking[]>({
    fetchFn: async () => {
      const res = await getBookings()
      return res.results ?? []
    }
  })

  const handleActionClick = async (
    action: { id: string },
    item: Booking | Record<string, never>
  ) => {
    if (!('id' in item)) return
    const booking = item as Booking

    if (action.id === 'edit') {
      setSelected(booking)
      setSubmitError(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'confirm') {
      setSubmitError(null)
      try {
        await confirmBooking(booking.id)
        await refetch()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('errors.confirmFailed'))
      }
      return
    }
    if (action.id === 'cancel') {
      setSubmitError(null)
      try {
        await cancelBooking(booking.id)
        await refetch()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('errors.cancelFailed'))
      }
    }
  }

  const handleSave = async (payload: Partial<Booking>) => {
    if (!selected) return
    setSubmitError(null)
    try {
      await updateBooking(selected.id, {
        status: payload.status,
        notes: payload.notes,
        admin_notes: payload.admin_notes
      })
      setEditOpen(false)
      await refetch()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('errors.saveFailed'))
    }
  }

  const initialData: Partial<Booking> = selected
    ? {
        status: selected.status,
        notes: selected.notes ?? '',
        admin_notes: selected.admin_notes ?? ''
      }
    : { status: 'pending', notes: '', admin_notes: '' }

  const tableData = useMemo(() => data ?? [], [data])

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
        data={tableData}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getBooking(typeof id === 'string' ? parseInt(id, 10) : id)}
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
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
