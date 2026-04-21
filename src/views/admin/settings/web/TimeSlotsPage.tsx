'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

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

type BatchFormState = {
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  max_bookings: number
  is_active: boolean
  name: string
  notes: string
  weekdays: number[]
}

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

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDatesForWeekdays(startDate: string, endDate: string, weekdays: number[]): string[] {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return []
  }

  const allowedWeekdays = new Set(weekdays)
  const result: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    if (allowedWeekdays.has(cursor.getDay())) {
      result.push(formatDateKey(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
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

const emptyBatchForm: BatchFormState = {
  start_date: toDateInputValue(new Date().toISOString()),
  end_date: toDateInputValue(new Date().toISOString()),
  start_time: '09:00',
  end_time: '17:00',
  max_bookings: 5,
  is_active: true,
  name: '',
  notes: '',
  weekdays: [new Date().getDay()]
}

export default function TimeSlotsPage() {
  const t = useTranslations('admin')
  const [editOpen, setEditOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [selected, setSelected] = useState<BookingTimeSlot | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchForm, setBatchForm] = useState<BatchFormState>(emptyBatchForm)

  const weekdayOptions = useMemo(
    () => [
      { value: 0, label: t('settings.web.timeSlots.batch.weekdays.sun') },
      { value: 1, label: t('settings.web.timeSlots.batch.weekdays.mon') },
      { value: 2, label: t('settings.web.timeSlots.batch.weekdays.tue') },
      { value: 3, label: t('settings.web.timeSlots.batch.weekdays.wed') },
      { value: 4, label: t('settings.web.timeSlots.batch.weekdays.thu') },
      { value: 5, label: t('settings.web.timeSlots.batch.weekdays.fri') },
      { value: 6, label: t('settings.web.timeSlots.batch.weekdays.sat') }
    ],
    [t]
  )

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
      setSubmitSuccess(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as BookingTimeSlot)
      setSubmitError(null)
      setSubmitSuccess(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        setSubmitError(null)
        setSubmitSuccess(null)
        await deleteBookingTimeSlot((item as BookingTimeSlot).id)
        setSubmitSuccess(t('settings.web.timeSlots.messages.deleted'))
        await refetch()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('settings.web.timeSlots.errors.deleteFailed'))
      }
    }
  }

  const handleSave = async (payload: Partial<BookingTimeSlot>) => {
    setSubmitError(null)
    setSubmitSuccess(null)
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
      setSubmitSuccess(
        selected ? t('settings.web.timeSlots.messages.updated') : t('settings.web.timeSlots.messages.created')
      )
      await refetch()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('settings.web.timeSlots.errors.saveFailed'))
    }
  }

  const handleBatchFieldChange = <K extends keyof BatchFormState>(field: K, value: BatchFormState[K]) => {
    setBatchForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleWeekdayToggle = (weekday: number) => {
    setBatchForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter((item) => item !== weekday)
        : [...prev.weekdays, weekday].sort((a, b) => a - b)
    }))
  }

  const resetBatchForm = () => {
    setBatchForm({
      ...emptyBatchForm,
      start_date: toDateInputValue(new Date().toISOString()),
      end_date: toDateInputValue(new Date().toISOString()),
      weekdays: [new Date().getDay()]
    })
  }

  const handleBatchGenerate = async () => {
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!batchForm.start_date || !batchForm.end_date) {
      setSubmitError(t('settings.web.timeSlots.batch.errors.missingDateRange'))
      return
    }

    if (batchForm.weekdays.length === 0) {
      setSubmitError(t('settings.web.timeSlots.batch.errors.missingWeekdays'))
      return
    }

    const dates = getDatesForWeekdays(batchForm.start_date, batchForm.end_date, batchForm.weekdays)
    if (dates.length === 0) {
      setSubmitError(t('settings.web.timeSlots.batch.errors.noMatchingDates'))
      return
    }

    const existingKeys = new Set(
      (data ?? []).map(
        (item) => `${item.slot_type}|${toDateInputValue(item.date)}|${toTimeInputValue(item.start_time)}|${toTimeInputValue(item.end_time)}`
      )
    )

    const payloads = dates
      .filter((date) => {
        const key = `${DEFAULT_SLOT_TYPE}|${date}|${batchForm.start_time}|${batchForm.end_time}`
        return !existingKeys.has(key)
      })
      .map((date) => ({
        slot_type: DEFAULT_SLOT_TYPE as BookingSlotType,
        date,
        start_time: batchForm.start_time,
        end_time: batchForm.end_time,
        max_bookings: Number(batchForm.max_bookings) || 5,
        is_active: batchForm.is_active,
        name: batchForm.name,
        notes: batchForm.notes
      }))

    if (payloads.length === 0) {
      setSubmitError(t('settings.web.timeSlots.batch.errors.allExist'))
      return
    }

    try {
      setBatchSubmitting(true)
      for (const payload of payloads) {
        await createBookingTimeSlot(payload)
      }
      setBatchOpen(false)
      resetBatchForm()
      setSubmitSuccess(t('settings.web.timeSlots.batch.messages.generated', { count: payloads.length }))
      await refetch()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('settings.web.timeSlots.batch.errors.generateFailed')
      )
    } finally {
      setBatchSubmitting(false)
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
          type='time'
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
      <Alert severity='error' onClose={() => {}}>
        {error}
      </Alert>
    )
  }

  return (
    <>
      {submitSuccess && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
          {submitSuccess}
        </Alert>
      )}
      {submitError && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant='outlined'
          startIcon={<i className='tabler-calendar-repeat' />}
          onClick={() => {
            setSubmitError(null)
            setSubmitSuccess(null)
            resetBatchForm()
            setBatchOpen(true)
          }}
        >
          {t('settings.web.timeSlots.batch.action')}
        </Button>
      </Box>
      <SchemaTable
        schema={listSchema}
        data={data ?? []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) =>
          getBookingTimeSlot(typeof id === 'string' ? parseInt(id, 10) : id)
        }
        statusColors={statusColors}
      />
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
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
      <Dialog open={batchOpen} onClose={() => !batchSubmitting && setBatchOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('settings.web.timeSlots.batch.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {t('settings.web.timeSlots.batch.description')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type='date'
                label={t('settings.web.timeSlots.batch.fields.startDate')}
                value={batchForm.start_date}
                onChange={(e) => handleBatchFieldChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type='date'
                label={t('settings.web.timeSlots.batch.fields.endDate')}
                value={batchForm.end_date}
                onChange={(e) => handleBatchFieldChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type='time'
                label={t('settings.web.timeSlots.batch.fields.startTime')}
                value={batchForm.start_time}
                onChange={(e) => handleBatchFieldChange('start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type='time'
                label={t('settings.web.timeSlots.batch.fields.endTime')}
                value={batchForm.end_time}
                onChange={(e) => handleBatchFieldChange('end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              fullWidth
              type='number'
              label={t('settings.web.timeSlots.batch.fields.maxBookings')}
              value={batchForm.max_bookings}
              onChange={(e) => handleBatchFieldChange('max_bookings', Math.max(1, Number(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              label={t('settings.web.timeSlots.fields.nameOptional')}
              value={batchForm.name}
              onChange={(e) => handleBatchFieldChange('name', e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={t('settings.web.timeSlots.fields.notes')}
              value={batchForm.notes}
              onChange={(e) => handleBatchFieldChange('notes', e.target.value)}
            />
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1.5 }}>
                {t('settings.web.timeSlots.batch.fields.weekdays')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {weekdayOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={batchForm.weekdays.includes(option.value)}
                        onChange={() => handleWeekdayToggle(option.value)}
                      />
                    }
                    label={option.label}
                    sx={{ mr: 1 }}
                  />
                ))}
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={batchForm.is_active}
                  onChange={(e) => handleBatchFieldChange('is_active', e.target.checked)}
                />
              }
              label={t('settings.web.timeSlots.fields.active')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setBatchOpen(false)} disabled={batchSubmitting}>
            {t('settings.web.timeSlots.batch.cancel')}
          </Button>
          <Button variant='contained' onClick={handleBatchGenerate} disabled={batchSubmitting}>
            {batchSubmitting ? t('settings.web.timeSlots.batch.generating') : t('settings.web.timeSlots.batch.generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
