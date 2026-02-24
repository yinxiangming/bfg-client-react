'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'

import {
  getMyBookings,
  getAvailableTimeSlots,
  createBooking,
  cancelBooking
} from '@/services/webBooking'
import type { Booking, BookingStatus, BookingTimeSlot } from '@/services/webBooking'

const DEFAULT_SLOT_TYPE = 'dropoff'

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

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

const statusColors: Record<
  BookingStatus,
  'default' | 'primary' | 'success' | 'warning' | 'error'
> = {
  pending: 'warning',
  confirmed: 'primary',
  cancelled: 'default',
  completed: 'success',
  no_show: 'error'
}

export default function Bookings() {
  const t = useTranslations('account')
  const listSchema: ListSchema = useMemo(
    () => ({
      title: t('bookings.myBookings'),
      columns: [
        {
          field: 'slot_date',
          label: t('bookings.columns.dateTime'),
          type: 'string',
          sortable: true,
          render: (_, row: Booking) => slotDisplay(row)
        },
        { field: 'slot_type', label: t('bookings.columns.type'), type: 'string', sortable: true },
        { field: 'status', label: t('bookings.columns.status'), type: 'select', sortable: true },
        { field: 'created_at', label: t('bookings.columns.created'), type: 'date', sortable: true }
      ],
      actions: [
        {
          id: 'cancel',
          label: t('bookings.actions.cancel'),
          type: 'danger',
          scope: 'row',
          confirm: t('bookings.actions.confirmCancel')
        }
      ]
    }),
    [t]
  )
  const [error, setError] = useState<string | null>(null)
  const [bookDate, setBookDate] = useState(() => toDateInputValue(new Date()))
  const [availableSlots, setAvailableSlots] = useState<BookingTimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null)

  const { data: bookingsData, loading, refetch } = useApiData<Booking[]>({
    fetchFn: getMyBookings
  })
  const bookings = bookingsData ?? []

  useEffect(() => {
    if (!bookDate) {
      setAvailableSlots([])
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    setAvailableSlots([])
    getAvailableTimeSlots({ slot_type: DEFAULT_SLOT_TYPE, date: bookDate })
      .then((data) => {
        if (!cancelled) setAvailableSlots(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setAvailableSlots([])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookDate])

  const handleBookSlot = async (timeslotId: number) => {
    setError(null)
    setBookingSlotId(timeslotId)
    try {
      await createBooking({ timeslot: timeslotId })
      setBookDate(toDateInputValue(new Date()))
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bookings.errors.bookFailed'))
    } finally {
      setBookingSlotId(null)
    }
  }

  const handleActionClick = async (
    action: { id: string },
    item: Booking | Record<string, never>
  ) => {
    if (action.id === 'cancel' && 'id' in item) {
      setError(null)
      try {
        await cancelBooking((item as Booking).id)
        await refetch()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('bookings.errors.cancelFailed'))
      }
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('bookings.bookDropOff')}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                rowGap: 1.5
              }}
            >
              <TextField
                label={t('bookings.date')}
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ width: 152, '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
              />
              {slotsLoading ? (
                <CircularProgress size={24} />
              ) : availableSlots.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {bookDate ? t('bookings.noSlotsOnDate') : t('bookings.selectDate')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outlined"
                      size="small"
                      disabled={bookingSlotId !== null}
                      onClick={() => handleBookSlot(slot.id)}
                    >
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      {slot.name ? ` (${slot.name})` : ''}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {t('bookings.empty')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <SchemaTable
            schema={listSchema}
            data={bookings}
            onActionClick={handleActionClick}
            statusColors={statusColors}
          />
        )}
      </Grid>
    </Grid>
  )
}
