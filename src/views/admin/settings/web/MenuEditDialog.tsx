'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

import CustomTextField from '@/components/ui/TextField'
import type { Menu, MenuPayload, MenuItem } from '@/services/web'

type MenuEditDialogProps = {
  open: boolean
  menu: Menu | null
  onClose: () => void
  onSave: (data: MenuPayload) => Promise<void> | void
}

type ItemRow = {
  id?: number
  title: string
  url: string
  order: number
  open_in_new_tab: boolean
  is_active: boolean
}

function toItemRows(items: MenuItem[] | undefined): ItemRow[] {
  if (!items || !Array.isArray(items)) return []
  return items.map((i, idx) => ({
    id: i.id,
    title: i.title || '',
    url: i.url || '',
    order: i.order ?? idx,
    open_in_new_tab: Boolean(i.open_in_new_tab),
    is_active: i.is_active !== false
  }))
}

const MenuEditDialog = ({ open, menu, onClose, onSave }: MenuEditDialogProps) => {
  const t = useTranslations('admin')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [location, setLocation] = useState<'header' | 'footer' | 'sidebar'>('header')
  const [language, setLanguage] = useState('en')
  const [is_active, setIsActive] = useState(true)
  const [items, setItems] = useState<ItemRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (menu) {
      setName(menu.name || '')
      setSlug(menu.slug || '')
      setLocation((menu.location as 'header' | 'footer' | 'sidebar') || 'header')
      setLanguage(menu.language || 'en')
      setIsActive(menu.is_active !== false)
      setItems(toItemRows(menu.items))
    } else {
      setName('')
      setSlug('')
      setLocation('header')
      setLanguage('en')
      setIsActive(true)
      setItems([])
    }
  }, [open, menu])

  const updateItem = (index: number, field: keyof ItemRow, value: string | number | boolean) => {
    setItems(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addItem = () => {
    setItems(prev => [...prev, { title: '', url: '', order: prev.length, open_in_new_tab: false, is_active: true }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, order: i })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: MenuPayload = {
        name,
        slug,
        location,
        language,
        is_active,
        items: items.map((row, i) => ({
          id: row.id,
          title: row.title.trim(),
          url: row.url.trim() || '/',
          order: i,
          open_in_new_tab: row.open_in_new_tab,
          is_active: row.is_active
        }))
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{t('settings.web.menus.editDialog.title')}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t('settings.web.menus.editDialog.fields.name')}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t('settings.web.menus.editDialog.fields.slug')}
                value={slug}
                onChange={e => setSlug(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label={t('settings.web.menus.editDialog.fields.location')}
                value={location}
                onChange={e => setLocation(e.target.value as 'header' | 'footer' | 'sidebar')}
              >
                <option value='header'>{t('settings.web.menus.editDialog.locationOptions.header')}</option>
                <option value='footer'>{t('settings.web.menus.editDialog.locationOptions.footer')}</option>
                <option value='sidebar'>{t('settings.web.menus.editDialog.locationOptions.sidebar')}</option>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={t('settings.web.menus.editDialog.fields.language')}
                value={language}
                onChange={e => setLanguage(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Checkbox checked={is_active} onChange={e => setIsActive(e.target.checked)} />}
                label={t('settings.web.menus.editDialog.fields.active')}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                {t('settings.web.menus.editDialog.fields.menuItems')}
              </Typography>
              {items.map((row, idx) => (
                <Box
                  key={row.id ?? idx}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    mb: 1.5,
                    flexWrap: 'wrap'
                  }}
                >
                  <CustomTextField
                    size='small'
                    placeholder={t('settings.web.menus.editDialog.itemTitle')}
                    value={row.title}
                    onChange={e => updateItem(idx, 'title', e.target.value)}
                    sx={{ minWidth: 120, flex: 1 }}
                  />
                  <CustomTextField
                    size='small'
                    placeholder={t('settings.web.menus.editDialog.itemUrl')}
                    value={row.url}
                    onChange={e => updateItem(idx, 'url', e.target.value)}
                    sx={{ minWidth: 140, flex: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size='small'
                        checked={row.open_in_new_tab}
                        onChange={e => updateItem(idx, 'open_in_new_tab', e.target.checked)}
                      />
                    }
                    label={t('settings.web.menus.editDialog.openInNewTab')}
                  />
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => removeItem(idx)}
                    aria-label={t('settings.web.menus.editDialog.removeItem')}
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </Box>
              ))}
              <Button size='small' variant='outlined' startIcon={<i className='tabler-plus' />} onClick={addItem} type='button'>
                {t('settings.web.menus.editDialog.addItem')}
              </Button>
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button type='button' variant='outlined' onClick={onClose}>
                {t('common.schemaForm.cancel')}
              </Button>
              <Button type='submit' variant='contained' disabled={saving}>
                {saving ? t('common.schemaForm.saving') : t('common.schemaForm.save')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default MenuEditDialog
