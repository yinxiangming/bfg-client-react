'use client'

import { useMemo, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  getReviews,
  approveReview,
  rejectReview,
  deleteReview,
  type ProductReview as AdminProductReview,
  type GetReviewsParams
} from '@/services/store'
import { formatDate } from '@/utils/format'
import { bfgApi } from '@/utils/api'

function renderStars(rating: number) {
  const stars = []
  for (let i = 0; i < 5; i++) {
    stars.push(
      <i
        key={i}
        className={i < rating ? 'tabler-star-filled' : 'tabler-star'}
        style={{ color: '#fbbf24', fontSize: '0.875rem' }}
      />
    )
  }
  return stars
}

function buildReviewsSchema(
  t: (key: string) => string,
  opts: { onApprove: (row: AdminProductReview) => void }
): ListSchema {
  return {
    title: t('reviews.listPage.schema.title'),
    columns: [
      {
        field: 'product_name',
        label: t('reviews.listPage.schema.columns.product'),
        type: 'string',
        sortable: true
      },
      {
        field: 'customer_name',
        label: t('reviews.listPage.schema.columns.customer'),
        type: 'string',
        sortable: true
      },
      {
        field: 'rating',
        label: t('reviews.listPage.schema.columns.rating'),
        type: 'number',
        sortable: true,
        render: (value: number) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            {renderStars(value ?? 0)}
            <Typography component='span' variant='body2'>
              {value ?? 0}/5
            </Typography>
          </Box>
        )
      },
      {
        field: 'title',
        label: t('reviews.listPage.schema.columns.title'),
        type: 'string',
        link: 'view',
        render: (value: string, row: AdminProductReview) => {
          const text = value || row.comment || '-'
          const truncated = typeof text === 'string' && text.length > 60 ? text.slice(0, 60) + '…' : text
          return truncated
        }
      },
      {
        field: 'is_approved',
        label: t('reviews.listPage.schema.columns.status'),
        type: 'select',
        sortable: true,
        render: (value: boolean, row: AdminProductReview) => {
          const approved = !!value
          return (
            <Chip
              size='small'
              label={approved ? t('reviews.status.approved') : t('reviews.status.pending')}
              color={approved ? 'success' : 'warning'}
              variant='filled'
              onClick={
                approved
                  ? undefined
                  : (e: React.MouseEvent) => {
                      e.stopPropagation()
                      opts.onApprove(row)
                    }
                  }
              style={approved ? undefined : { cursor: 'pointer' }}
            />
          )
        }
      },
      {
        field: 'created_at',
        label: t('reviews.listPage.schema.columns.createdAt'),
        type: 'datetime',
        sortable: true,
        render: (value: string) => (value ? formatDate(value, 'yyyy-MM-dd') : '-')
      }
    ],
    filters: [
      {
        field: 'product',
        label: t('reviews.listPage.filters.product.label'),
        type: 'select',
        filterMode: 'api',
        optionsSource: 'api',
        optionsApi: bfgApi.products(),
        optionsValueField: 'id',
        optionsLabelField: 'name'
      },
      {
        field: 'is_approved',
        label: t('reviews.listPage.filters.status.label'),
        type: 'select',
        filterMode: 'api',
        options: [
          { value: '', label: t('common.schemaTable.all') },
          { value: 'true', label: t('reviews.status.approved') },
          { value: 'false', label: t('reviews.status.pending') }
        ]
      }
    ] as SchemaFilter[],
    actions: [
      {
        id: 'view',
        label: t('reviews.listPage.actions.view'),
        type: 'primary',
        scope: 'row'
      },
      {
        id: 'approve',
        label: t('reviews.listPage.actions.approve'),
        type: 'primary',
        scope: 'row',
        icon: 'tabler-check'
      },
      {
        id: 'reject',
        label: t('reviews.listPage.actions.reject'),
        type: 'secondary',
        scope: 'row',
        icon: 'tabler-x'
      },
      {
        id: 'delete',
        label: t('reviews.listPage.actions.delete'),
        type: 'danger',
        scope: 'row',
        confirm: t('reviews.listPage.actions.confirmDelete')
      }
    ] as SchemaAction[]
  }
}

export default function ReviewsPage() {
  const t = useTranslations('admin')
  const [apiFilters, setApiFilters] = useState<Record<string, string>>({})
  const [selectedReview, setSelectedReview] = useState<AdminProductReview | null>(null)

  const { data: reviews, loading, error, refetch } = useApiData<AdminProductReview[]>({
    fetchFn: useCallback(() => getReviews(apiFilters as GetReviewsParams), [apiFilters]),
    deps: [JSON.stringify(apiFilters)]
  })

  const handleApprove = useCallback(
    async (row: AdminProductReview) => {
      try {
        await approveReview(row.id)
        await refetch()
      } catch (err: any) {
        alert(t('reviews.listPage.messages.actionFailed', { error: err?.message || 'Unknown' }))
      }
    },
    [refetch, t]
  )

  const reviewsSchema = useMemo(
    () => buildReviewsSchema(t, { onApprove: handleApprove }),
    [t, handleApprove]
  )

  const handleActionClick = useCallback(
    async (action: SchemaAction, item: AdminProductReview | {}) => {
      if (action.id === 'view') {
        setSelectedReview(item as AdminProductReview)
        return
      }
      if (!('id' in item)) return
      const id = item.id
      try {
        if (action.id === 'approve') {
          await approveReview(id)
          await refetch()
        } else if (action.id === 'reject') {
          await rejectReview(id)
          await refetch()
        } else if (action.id === 'delete') {
          await deleteReview(id)
          await refetch()
        }
      } catch (err: any) {
        alert(t('reviews.listPage.messages.actionFailed', { error: err?.message || 'Unknown' }))
      }
    },
    [refetch, t]
  )

  if (error && !reviews) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 4 }}>
        {t('reviews.listPage.title')}
      </Typography>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <SchemaTable
        schema={reviewsSchema}
        data={reviews || []}
        loading={loading}
        onActionClick={handleActionClick}
        filters={apiFilters}
        onFiltersChange={setApiFilters}
      />

      <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('reviews.listPage.schema.columns.title')}</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='body2' color='text.secondary'>
                {selectedReview.product_name} · {selectedReview.customer_name} ·{' '}
                {selectedReview.created_at ? formatDate(selectedReview.created_at, 'yyyy-MM-dd') : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {renderStars(selectedReview.rating ?? 0)}
                <Typography variant='body2'>({selectedReview.rating ?? 0}/5)</Typography>
              </Box>
              {selectedReview.title && (
                <Typography variant='subtitle2'>{selectedReview.title}</Typography>
              )}
              <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedReview.comment || '-'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReview(null)}>{t('common.actions.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
