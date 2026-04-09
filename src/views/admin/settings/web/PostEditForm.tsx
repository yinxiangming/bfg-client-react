'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Post, PostPayload } from '@/services/web'
import type { CategoryFieldsSchema } from '@/services/web'
import {
  getPost,
  getCategory,
  getCategories,
  createPost,
  updatePost
} from '@/services/web'
import type { Category } from '@/services/web'
import { bfgApi } from '@/utils/api'

import PostCustomFieldsBlock from './PostCustomFieldsBlock'

type PostFormData = Omit<PostPayload, 'featured_image'> & {
  featured_image?: File
}

export type PostEditFormProps = {
  /** `null` = create new post */
  postId: number | null
  /** Optional list row when opening edit (used if detail fetch fails) */
  listFallback?: Post | null
  onCancel: () => void
  /** After successful create; e.g. navigate to edit page */
  onCreated?: (post: Post) => void
}

const buildPostFormSchema = (t: (key: string) => string): FormSchema => ({
  title: t('settings.web.posts.editDialog.title'),
  fields: [
    { field: 'title', label: t('settings.web.posts.editDialog.fields.title'), type: 'string', required: true },
    { field: 'slug', label: t('settings.web.posts.editDialog.fields.slug'), type: 'string', required: true },
    { field: 'featured_image', label: t('settings.web.posts.editDialog.fields.featuredImage'), type: 'file', accept: 'image/*' },
    {
      field: 'language',
      label: t('settings.web.posts.editDialog.fields.language'),
      type: 'select',
      required: true,
      options: [
        { value: 'en', label: t('settings.web.posts.editDialog.languageOptions.en') },
        { value: 'zh-hans', label: t('settings.web.posts.editDialog.languageOptions.zhHans') }
      ],
      defaultValue: 'en'
    },
    { field: 'excerpt', label: t('settings.web.posts.editDialog.fields.excerpt'), type: 'textarea', rows: 3 },
    { field: 'content', label: t('settings.web.posts.editDialog.fields.content'), type: 'textarea', required: true, rows: 10 },
    {
      field: 'tag_ids',
      label: t('settings.web.posts.editDialog.fields.tags'),
      type: 'multiselect',
      optionsSource: 'api',
      optionsApi: bfgApi.tags(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'meta_title', label: t('settings.web.posts.editDialog.fields.seoTitle'), type: 'string' },
    { field: 'meta_description', label: t('settings.web.posts.editDialog.fields.seoDescription'), type: 'textarea', rows: 3 },
    {
      field: 'status',
      label: t('settings.web.posts.editDialog.fields.status'),
      type: 'select',
      required: true,
      options: [
        { value: 'draft', label: t('settings.web.posts.editDialog.statusOptions.draft') },
        { value: 'published', label: t('settings.web.posts.editDialog.statusOptions.published') },
        { value: 'archived', label: t('settings.web.posts.editDialog.statusOptions.archived') }
      ],
      defaultValue: 'draft'
    },
    { field: 'published_at', label: t('settings.web.posts.editDialog.fields.publishedAt'), type: 'datetime' },
    { field: 'allow_comments', label: t('settings.web.posts.editDialog.fields.allowComments'), type: 'boolean', defaultValue: true }
  ]
})

function mergeCustomFieldsForSchema(
  prev: Record<string, unknown>,
  schema: CategoryFieldsSchema | null | undefined
): Record<string, unknown> {
  if (!schema || Object.keys(schema).length === 0) return {}
  const next: Record<string, unknown> = {}
  for (const key of Object.keys(schema)) {
    const def = schema[key]
    const hasPrev =
      prev[key] !== undefined && prev[key] !== null && !(typeof prev[key] === 'string' && (prev[key] as string).trim() === '')
    if (hasPrev) {
      next[key] = prev[key]!
    } else if (def?.default !== undefined && def.default !== null && def.default !== '') {
      next[key] = def.default as unknown
    } else if (def?.type === 'boolean') {
      next[key] = false
    } else {
      next[key] = ''
    }
  }
  return next
}

function validateRequiredCustomFields(
  schema: CategoryFieldsSchema | null | undefined,
  vals: Record<string, unknown>
): string | null {
  if (!schema) return null
  for (const [key, def] of Object.entries(schema)) {
    if (!def.required) continue
    const v = vals[key]
    if (def.type === 'boolean') {
      if (v !== true && v !== false) return key
      continue
    }
    if (v === undefined || v === null) return key
    if (typeof v === 'string' && v.trim() === '') return key
  }
  return null
}

export default function PostEditForm({ postId, listFallback, onCancel, onCreated }: PostEditFormProps) {
  const t = useTranslations('admin')
  const locale = useLocale()
  const postFormSchema = useMemo(() => buildPostFormSchema(t as (key: string) => string), [t])

  const [categoryOptions, setCategoryOptions] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [fieldsSchema, setFieldsSchema] = useState<CategoryFieldsSchema | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [detailPost, setDetailPost] = useState<Post | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    getCategories('post')
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]))
  }, [])

  useEffect(() => {
    const fallback =
      listFallback && postId != null && listFallback.id === postId ? listFallback : null

    if (postId == null) {
      setDetailPost(null)
      setCategoryId('')
      setFieldsSchema(null)
      setCustomFields({})
      setDetailError(null)
      setFormKey(k => k + 1)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoadingDetail(true)
      setDetailError(null)
      try {
        const full = await getPost(postId)
        if (cancelled) return
        setDetailPost(full)
        const cid = full.category_id ?? ''
        setCategoryId(cid === '' ? '' : cid)
        if (cid !== '' && cid != null) {
          const cat = await getCategory(Number(cid))
          if (cancelled) return
          const sch = cat.fields_schema ?? {}
          setFieldsSchema(sch)
          setCustomFields(mergeCustomFieldsForSchema(full.custom_fields ?? {}, sch))
        } else {
          setFieldsSchema(null)
          setCustomFields(full.custom_fields ?? {})
        }
        setFormKey(k => k + 1)
      } catch (e: unknown) {
        if (cancelled) return
        setDetailError(e instanceof Error ? e.message : t('settings.web.posts.editDialog.loadDetailFailed'))
        if (fallback) {
          setDetailPost(fallback)
          const cid = fallback.category_id ?? ''
          setCategoryId(cid === '' ? '' : cid)
          setCustomFields((fallback.custom_fields as Record<string, unknown>) ?? {})
          setFieldsSchema(fallback.category_fields_schema ?? null)
        } else {
          setDetailPost(null)
        }
        setFormKey(k => k + 1)
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [postId, listFallback?.id, t])

  const handleCategoryChange = useCallback(async (id: number | '') => {
    setCategoryId(id)
    if (id === '' || id === null || id === undefined) {
      setFieldsSchema(null)
      setCustomFields({})
      return
    }
    setLoadingCategory(true)
    try {
      const cat = await getCategory(Number(id))
      const sch = cat.fields_schema ?? {}
      setFieldsSchema(sch)
      setCustomFields(prev => mergeCustomFieldsForSchema(prev, sch))
    } catch {
      setFieldsSchema(null)
    } finally {
      setLoadingCategory(false)
    }
  }, [])

  const schemaFormInitialData = useMemo((): Partial<PostFormData> => {
    if (postId == null) {
      const defaultLang = locale === 'zh-hans' ? 'zh-hans' : 'en'
      return {
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        allow_comments: true,
        language: defaultLang,
        tag_ids: []
      }
    }
    const fallbackRow =
      listFallback && postId != null && listFallback.id === postId ? listFallback : null
    const src = detailPost ?? fallbackRow
    if (!src) {
      return {
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        allow_comments: true,
        language: locale === 'zh-hans' ? 'zh-hans' : 'en',
        tag_ids: []
      }
    }
    return {
      title: src.title,
      slug: src.slug,
      content: src.content,
      excerpt: src.excerpt,
      tag_ids: src.tag_ids ?? [],
      meta_title: src.meta_title,
      meta_description: src.meta_description,
      status: src.status,
      published_at: src.published_at,
      allow_comments: src.allow_comments,
      language: src.language
    }
  }, [postId, detailPost, listFallback, locale])

  const handleSubmit = async (data: Partial<PostFormData>) => {
    const missingKey = validateRequiredCustomFields(fieldsSchema, customFields)
    if (missingKey) {
      setSnackbar({
        open: true,
        message: t('settings.web.posts.editDialog.customFieldRequired', { key: missingKey }),
        severity: 'error'
      })
      return
    }

    const payload: PostPayload = {
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      excerpt: data.excerpt,
      featured_image: data.featured_image,
      category_id: categoryId === '' ? undefined : Number(categoryId),
      custom_fields: customFields,
      tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
      published_at: data.published_at,
      allow_comments: Boolean(data.allow_comments),
      language: data.language || 'en'
    }

    setSaving(true)
    try {
      if (postId == null) {
        const created = await createPost(payload)
        setSnackbar({
          open: true,
          message: t('settings.web.posts.editPage.createdSuccess'),
          severity: 'success'
        })
        onCreated?.(created)
      } else {
        const updated = await updatePost(postId, payload)
        setDetailPost(updated)
        setSnackbar({
          open: true,
          message: t('settings.web.posts.editPage.updatedSuccess'),
          severity: 'success'
        })
      }
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: t('settings.web.posts.tab.errors.saveFailed', {
          error: err instanceof Error ? err.message : 'Unknown error'
        }),
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const busy = loadingDetail || loadingCategory || saving
  const pageTitle =
    postId == null
      ? t('settings.web.posts.editPage.titleNew')
      : t('settings.web.posts.editPage.titleEdit', {
          title:
            detailPost?.title ||
            (listFallback && postId != null && listFallback.id === postId ? listFallback.title : undefined) ||
            '…'
        })

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 2, px: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant='outlined' color='inherit' startIcon={<i className='tabler-arrow-left' />} onClick={onCancel}>
          {t('settings.web.posts.editPage.back')}
        </Button>
        <Typography variant='h4' component='h1' sx={{ flex: '1 1 auto' }}>
          {pageTitle}
        </Typography>
      </Box>

      <Card
        variant='outlined'
        sx={{
          borderRadius: 2,
          bgcolor: 'background.paper',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {detailError ? (
            <Alert severity='warning' sx={{ mb: 2 }}>
              {detailError}
            </Alert>
          ) : null}

          <FormControl fullWidth size='small' disabled={busy} sx={{ mb: 2 }}>
            <InputLabel id='post-edit-category-label'>{t('settings.web.posts.editDialog.fields.category')}</InputLabel>
            <Select<number | ''>
              labelId='post-edit-category-label'
              label={t('settings.web.posts.editDialog.fields.category')}
              value={categoryId}
              onChange={e => {
                const v = e.target.value
                handleCategoryChange(v === '' ? '' : Number(v))
              }}
            >
              <MenuItem value=''>
                <em>{t('settings.web.posts.editDialog.categoryNone')}</em>
              </MenuItem>
              {categoryOptions.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingCategory ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={18} />
              <Typography variant='caption' color='text.secondary'>
                {t('settings.web.posts.editDialog.loadingCategorySchema')}
              </Typography>
            </Box>
          ) : null}

          <PostCustomFieldsBlock
            schema={fieldsSchema}
            value={customFields}
            onChange={setCustomFields}
            disabled={busy}
          />

          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                '& .MuiCard-root': {
                  boxShadow: 'none',
                  bgcolor: 'transparent',
                  backgroundImage: 'none'
                },
                '& .MuiCardContent-root': { px: 0, pb: 0, pt: 0 }
              }}
            >
              <SchemaForm
                key={formKey}
                schema={postFormSchema}
                initialData={schemaFormInitialData}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                hideTitle
                loading={saving}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
