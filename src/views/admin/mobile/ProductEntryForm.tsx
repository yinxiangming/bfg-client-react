'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { apiFetch, buildApiUrl, API_VERSIONS } from '@/utils/api'
import { getCategories, uploadProductMedia } from '@/services/store'
import type { Category } from '@/services/store'

interface PersistedState {
  locationCode: string
  categoryId: number | ''
}

export default function ProductEntryForm() {
  const router = useRouter()
  const t = useTranslations('admin.mobileAdmin.productEntry')
  const nameRef = useRef<HTMLInputElement>(null)

  // Fields that reset after each submit
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // Fields that persist across submits
  const [locationCode, setLocationCode] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')

  // Ref keeps persisted values so we can restore them after setState reset
  const persistRef = useRef<PersistedState>({ locationCode: '', categoryId: '' })
  useEffect(() => { persistRef.current = { locationCode, categoryId } }, [locationCode, categoryId])

  // Supporting data
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const [inlineError, setInlineError] = useState('')
  const mobileFieldSx = {
    '& .MuiInputBase-input': { fontSize: '2rem', py: 1.5 },
    '& .MuiSelect-select': { fontSize: '2rem', py: 1.5 },
    '& .MuiInputLabel-root': { fontSize: '2rem' },
    '& .MuiFormHelperText-root': { fontSize: '0.9rem' },
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPhotos(prev => [...prev, ...files])
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const resetForm = () => {
    setName('')
    setQuantity(1)
    setPhotos([])
    setPhotoPreviews(prev => { prev.forEach(URL.revokeObjectURL); return [] })
    setLocationCode(persistRef.current.locationCode)
    setCategoryId(persistRef.current.categoryId)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setInlineError(t('errorRequired'))
      nameRef.current?.focus()
      return
    }
    setInlineError('')
    setIsSubmitting(true)

    try {
      const url = buildApiUrl('/products/quick-entry/', API_VERSIONS.BFG2)
      const product = await apiFetch<{ id: number; name: string; slug: string }>(url, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          quantity: Number(quantity) || 1,
          location_code: locationCode.trim() || undefined,
          category_id: categoryId || undefined,
          language: 'en',
        }),
      })

      for (const file of photos) {
        try {
          await uploadProductMedia(product.id, file)
        } catch {
          // non-fatal — product is already created
        }
      }

      setSnack({ open: true, message: t('successMessage', { name: product.name }), severity: 'success' })
      resetForm()
    } catch (err: any) {
      setInlineError(err?.message || err?.detail || t('errorSubmit'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton size='small' onClick={() => router.push('/admin/m')} title={t('back')}>
          <span className='iconify' data-icon='mdi:arrow-left' />
        </IconButton>
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          {t('title')}
        </Typography>
      </Box>

      <Stack spacing={2.5}>
        {/* Product model */}
        <TextField
          inputRef={nameRef}
          value={name}
          onChange={e => setName(e.target.value)}
          required
          fullWidth
          autoFocus
          placeholder={t('namePlaceholder')}
          error={!!inlineError && !name.trim()}
          inputProps={{ autoCapitalize: 'off' }}
          sx={mobileFieldSx}
        />

        {/* Quantity */}
        <TextField
          type='number'
          value={quantity}
          onChange={e => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
          required
          fullWidth
          inputProps={{ min: 1, inputMode: 'numeric' }}
          placeholder={t('quantity')}
          sx={mobileFieldSx}
        />

        {/* Storage location */}
        <TextField
          value={locationCode}
          onChange={e => setLocationCode(e.target.value)}
          fullWidth
          placeholder={t('locationPlaceholder')}
          helperText={t('locationHelper')}
          inputProps={{ autoCapitalize: 'characters' }}
          sx={mobileFieldSx}
        />

        {/* Category */}
        <FormControl fullWidth sx={mobileFieldSx}>
          <Select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value as number | '')}
            displayEmpty
            renderValue={value => {
              if (categoryId === '') {
                return <span style={{ color: 'rgba(0,0,0,0.6)' }}>{t('category')}</span>
              }
              const selected = categories.find(cat => String(cat.id) === String(value))
              return selected?.name || ''
            }}
          >
            <MenuItem value=''>
              <em>{t('categoryNone')}</em>
            </MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Photos */}
        <Box>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            {t('photos')}
          </Typography>
          <Button
            variant='outlined'
            component='label'
            fullWidth
            startIcon={<span className='iconify' data-icon='mdi:camera-plus' />}
            sx={{ py: 1.5 }}
          >
            {t('addPhoto')}
            <input
              type='file'
              accept='image/*'
              multiple
              capture='environment'
              hidden
              onChange={handlePhotoChange}
            />
          </Button>

          {photoPreviews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {photoPreviews.map((src, idx) => (
                <Box
                  key={idx}
                  sx={{ position: 'relative', width: 80, height: 80, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size='small'
                    onClick={() => removePhoto(idx)}
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', p: 0.25 }}
                  >
                    <span className='iconify text-sm' data-icon='mdi:close' />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Inline error */}
        {inlineError && (
          <Alert severity='error' onClose={() => setInlineError('')}>
            {inlineError}
          </Alert>
        )}

        {/* Submit */}
        <Button
          variant='contained'
          size='large'
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color='inherit' /> : undefined}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
