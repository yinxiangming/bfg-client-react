'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Page, PagePayload, PageBlockItem } from '@/services/web'
import { updatePageBlocks } from '@/services/web'
import { bfgApi } from '@/utils/api'
import Button from '@mui/material/Button'
import {
  PageBuilder,
  getBlocksByCategory,
  getBlockDefinition,
  getBlockComponent,
  BlockRenderContext,
} from '@/views/storefront/blocks'
import type { BlockConfig } from '@/views/common/blocks/types'

type PageEditDialogProps = {
  open: boolean
  page: Page | null
  onClose: () => void
  onSave: (data: PagePayload) => Promise<void> | void
  /** Called after blocks are saved via dedicated API (so list can refetch). */
  onBlocksSaved?: () => void
}

const buildPageFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.pages.editDialog.title'),
  fields: [
    { field: 'title', label: t('settings.web.pages.editDialog.fields.title'), type: 'string', required: true },
    { field: 'slug', label: t('settings.web.pages.editDialog.fields.slug'), type: 'string', required: true },
    { field: 'content', label: t('settings.web.pages.editDialog.fields.content'), type: 'textarea', required: true, rows: 10 },
    { field: 'excerpt', label: t('settings.web.pages.editDialog.fields.excerpt'), type: 'textarea', rows: 3 },
    {
      field: 'parent_id',
      label: t('settings.web.pages.editDialog.fields.parentPage'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.pages(),
      optionLabelTemplate: '{{title}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'template', label: t('settings.web.pages.editDialog.fields.template'), type: 'string' },
    { field: 'meta_title', label: t('settings.web.pages.editDialog.fields.seoTitle'), type: 'string' },
    { field: 'meta_description', label: t('settings.web.pages.editDialog.fields.seoDescription'), type: 'textarea', rows: 3 },
    { field: 'meta_keywords', label: t('settings.web.pages.editDialog.fields.seoKeywords'), type: 'string' },
    {
      field: 'status',
      label: t('settings.web.pages.editDialog.fields.status'),
      type: 'select',
      required: true,
      options: [
        { value: 'draft', label: t('settings.web.pages.editDialog.statusOptions.draft') },
        { value: 'published', label: t('settings.web.pages.editDialog.statusOptions.published') },
        { value: 'archived', label: t('settings.web.pages.editDialog.statusOptions.archived') }
      ],
      defaultValue: 'draft'
    },
    { field: 'is_featured', label: t('settings.web.pages.editDialog.fields.featured'), type: 'boolean', defaultValue: false },
    { field: 'allow_comments', label: t('settings.web.pages.editDialog.fields.allowComments'), type: 'boolean', defaultValue: false },
    { field: 'order', label: t('settings.web.pages.editDialog.fields.order'), type: 'number', defaultValue: 100 },
    { field: 'language', label: t('settings.web.pages.editDialog.fields.language'), type: 'string', required: true, defaultValue: 'en' }
  ]
})

function normalizeBlocks(blocks: PageBlockItem[] | undefined): BlockConfig[] {
  if (!blocks || !Array.isArray(blocks)) return []
  return blocks.map((b, i) => ({
    id: b.id || `block_${i}_${Date.now()}`,
    type: b.type,
    settings: b.settings ?? {},
    data: b.data ?? {},
    resolvedData: b.resolvedData,
  }))
}

function toPageBlocks(blocks: BlockConfig[]): PageBlockItem[] {
  return blocks.map((b) => ({
    id: b.id,
    type: b.type,
    settings: Object.keys(b.settings || {}).length ? b.settings : undefined,
    data: Object.keys(b.data || {}).length ? b.data : undefined,
  }))
}

const PageEditDialog = ({ open, page, onClose, onSave, onBlocksSaved }: PageEditDialogProps) => {
  const t = useTranslations('admin')
  const pageFormSchema = useMemo(() => buildPageFormSchema(t), [t])
  const [activeTab, setActiveTab] = useState(0)
  const [blocks, setBlocks] = useState<BlockConfig[]>([])
  const [blocksSaving, setBlocksSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setBlocks(normalizeBlocks(page?.blocks))
      setActiveTab(0)
    }
  }, [open, page?.id])

  const initialData: Partial<Page> = page
    ? page
    : {
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        is_featured: false,
        allow_comments: false,
        order: 100,
        language: 'en'
      }

  const handleSubmit = async (data: Partial<Page>) => {
    const payload: PagePayload = {
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      excerpt: data.excerpt,
      parent_id: data.parent_id,
      template: data.template,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
      status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
      is_featured: Boolean(data.is_featured),
      allow_comments: Boolean(data.allow_comments),
      order: Number(data.order) || 100,
      language: data.language || 'en',
      blocks: toPageBlocks(blocks),
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={t('settings.web.pages.editDialog.tabs.basic')} id='page-edit-basic' />
          <Tab label={t('settings.web.pages.editDialog.tabs.blocks')} id='page-edit-blocks' disabled={!page} />
        </Tabs>
        <Box sx={{ pt: 0 }}>
          {activeTab === 0 && (
            <SchemaForm schema={pageFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
          )}
          {activeTab === 1 && page && (
            <Box sx={{ p: 2, minHeight: 480 }}>
              <BlockRenderContext.Provider value={getBlockComponent}>
                <PageBuilder
                  initialBlocks={blocks}
                  onBlocksChange={setBlocks}
                  getBlocksByCategory={getBlocksByCategory}
                  getBlockDefinition={getBlockDefinition}
                  getBlockComponent={getBlockComponent}
                />
              </BlockRenderContext.Provider>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  disabled={blocksSaving}
                  onClick={async () => {
                    if (!page) return
                    setBlocksSaving(true)
                    try {
                      await updatePageBlocks(page.id, toPageBlocks(blocks))
                      onBlocksSaved?.()
                    } catch (err: unknown) {
                      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : ''
                      alert(t('settings.web.pages.tab.errors.saveFailed', { error: msg || 'Unknown error' }))
                    } finally {
                      setBlocksSaving(false)
                    }
                  }}
                >
                  {blocksSaving ? '...' : t('settings.web.pages.editDialog.saveBlocks')}
                </Button>
                <Button onClick={onClose} disabled={blocksSaving}>{t('common.actions.cancel')}</Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default PageEditDialog

