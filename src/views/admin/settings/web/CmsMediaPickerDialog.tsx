'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { getMedia, uploadMedia, type Media } from '@/services/web'
import { getMediaUrl } from '@/utils/media'

type CmsMediaPickerDialogProps = {
  open: boolean
  onClose: () => void
  onSelect: (media: Media) => void
}

function isLikelyImage(m: Media): boolean {
  if (m.file_type === 'image') return true
  const name = (m.file_name || m.file || '').toLowerCase()
  return /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(name)
}

export default function CmsMediaPickerDialog({ open, onClose, onSelect }: CmsMediaPickerDialogProps) {
  const t = useTranslations('admin')
  const [items, setItems] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getMedia()
      .then(rows => setItems(Array.isArray(rows) ? rows.filter(isLikelyImage) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      m =>
        (m.file_name || '').toLowerCase().includes(s) ||
        (m.title || '').toLowerCase().includes(s) ||
        String(m.file || '')
          .toLowerCase()
          .includes(s)
    )
  }, [items, q])

  const handleUpload = async (file: File | null) => {
    if (!file) return
    setLoading(true)
    try {
      const created = await uploadMedia({ file })
      if (isLikelyImage(created)) {
        setItems(prev => [created, ...prev])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{t('settings.web.posts.contentEditor.mediaDialogTitle')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size='small'
            fullWidth
            sx={{ flex: '1 1 200px' }}
            placeholder={t('settings.web.posts.contentEditor.searchPlaceholder')}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Button variant='outlined' component='label' disabled={loading}>
            {t('settings.web.posts.contentEditor.upload')}
            <input
              type='file'
              hidden
              accept='image/*'
              onChange={e => {
                const f = e.target.files?.[0] ?? null
                e.target.value = ''
                void handleUpload(f)
              }}
            />
          </Button>
        </Box>
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
            {t('settings.web.posts.contentEditor.mediaEmpty')}
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            {filtered.map(m => {
              const src = getMediaUrl(m.file)
              return (
                <Grid key={m.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Paper
                    variant='outlined'
                    sx={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => {
                      onSelect(m)
                      onClose()
                    }}
                  >
                    <Box
                      component='img'
                      src={src}
                      alt={m.alt_text || m.title || ''}
                      sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                    <Typography variant='caption' noWrap sx={{ display: 'block', px: 1, py: 0.5 }}>
                      {m.file_name || m.title || `#${m.id}`}
                    </Typography>
                  </Paper>
                </Grid>
              )
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.schemaForm.cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}
