'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import { getCategories, type Category } from '@/services/store'
import { getContentPolicies, saveContentPolicy, type ContentPolicy } from '@/services/productContent'

const schema: FormSchema = {
  title: 'Public description',
  fields: [
    { field: 'mode', label: 'Category behavior', type: 'select', options: [{ value: 'own', label: 'Own content' }, { value: 'inherit', label: 'Inherit nearest parent' }, { value: 'off', label: 'Off (stop inheritance)' }], required: true },
    { field: 'text', label: 'Public description text', type: 'textarea', rows: 6, helperText: 'Saved independently. Never copied into the original product description.' },
    { field: 'include_descendants', label: 'Apply to descendant categories', type: 'boolean' },
    { field: 'enabled', label: 'Enabled', type: 'boolean' }
  ]
}

export default function ProductContentPolicies({ categoryId, initialLanguage = 'en' }: { categoryId?: number; initialLanguage?: string }) {
  const [policies, setPolicies] = useState<ContentPolicy[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [scope, setScope] = useState(categoryId ? String(categoryId) : '')
  const [language, setLanguage] = useState(initialLanguage)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError('')
    Promise.all([getContentPolicies(), getCategories(language)]).then(([items, cats]) => {
      if (!cancelled) { setPolicies(items); setCategories(cats); setReady(true) }
    }).catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [language])
  const policy = policies.find(item => item.category === (scope ? Number(scope) : null) && item.language === language)
  const initialData = useMemo<Partial<ContentPolicy>>(() => policy ?? { mode: scope ? 'inherit' : 'own', text: '', include_descendants: false, enabled: true }, [policy, scope])
  const formSchema = scope ? schema : { ...schema, fields: schema.fields?.map(field => field.field === 'mode' ? {
    ...field, options: [{ value: 'own', label: 'Own content' }, { value: 'off', label: 'Off' }]
  } : field).filter(field => field.field !== 'include_descendants') }

  return <Box sx={{ display: 'grid', gap: 2, maxWidth: 900 }}>
    <Typography variant='h6'>Product public descriptions</Typography>
    <Typography variant='body2'>Composition: product/channel body → category → workspace. Missing translations require content or an explicit segment opt-out. Saving invalidates earlier listing reviews; live listings require review before a remote update.</Typography>
    {!categoryId && <TextField select label='Content scope' value={scope} disabled={busy} onChange={event => { setScope(event.target.value); setMessage('') }}>
      <MenuItem value=''>Workspace / shop</MenuItem>
      {categories.map(category => <MenuItem key={category.id} value={String(category.id)}>{category.name} · {category.language}</MenuItem>)}
    </TextField>}
    <TextField label='Content language' value={language} disabled={busy} onChange={event => { setLanguage(event.target.value); setMessage('') }} helperText='Exact language code, e.g. en or zh-hans. No fallback between languages.' />
    {policy ? <Alert severity='info'>Saved revision {policy.revision}</Alert> : <Alert severity='info'>No policy in this language. Category defaults to inheritance; workspace defaults to no footer.</Alert>}
    {error && <Alert severity='error'>{error}</Alert>}
    {message && <Alert severity='success'>{message}</Alert>}
    {ready && <SchemaForm<Partial<ContentPolicy>> key={`${scope}:${language}:${policy?.revision ?? 0}`} schema={formSchema}
      initialData={initialData} loading={busy}
      onSubmit={async form => {
        setBusy(true); setError(''); setMessage('')
        try {
          const saved = await saveContentPolicy({ ...form, category: scope ? Number(scope) : null, language, slot: 'footer' }, policy?.id)
          setPolicies(current => [...current.filter(item => item.id !== saved.id), saved])
          setMessage(`Public description saved (revision ${saved.revision}).`)
        } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') } finally { setBusy(false) }
      }} />}
    <Button onClick={() => { setReady(false); getContentPolicies().then(items => { setPolicies(items); setReady(true) }).catch(err => setError(err.message)) }} disabled={busy}>Refresh saved policies</Button>
  </Box>
}
