'use client'

import type { ReactNode } from 'react'
import { useMemo, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  getReviews,
  approveReview,
  rejectReview,
  deleteReview,
  type ProductReview as Review,
  type GetReviewsParams
} from '@/services/store'
import { formatDate } from '@/utils/format'
import { bfgApi } from '@/utils/api'

const renderStars = (rating: number) => {
  const stars = []
  for (let i = 0; i < 5; i++) {
    stars.push(
      <i
        key={i}
        className={i < Math.floor(rating) ? 'tabler-star-filled' : 'tabler-star'}
        style={{ color: '#fbbf24', fontSize: '0.875rem' }}
      />
    )
  }
  return <span style={{ display: 'inline-flex' }}>{stars}</span>
}

export default function ReviewsPage() {
  const t = useTranslations('admin')
  const [apiFilters, setApiFilters] = useState<Record<string, string>>({})

  const { data: reviews, loading, error, refetch } = useApiData<Review[]>({
    fetchFn: useCallback(() => getReviews(apiFilters as GetReviewsParams), [apiFilters]),
    deps: [JSON.stringify(apiFilters)]
  })

  const schema: ListSchema = useMemo(
    () => ({
      title: t('reviews.listPage.schema.title'),
      columns: [
        {
          field: 'id',
          label: 'ID',
          type: 'number',
          sortable: true,
          render: (value: number): ReactNode => value
        },
        {
          field: 'product_name',
          label: t('reviews.listPage.schema.product'),
          type: 'string',
          sortable: true,
          render: (value: unknown, row: Review): ReactNode => String(row.product_name ?? value ?? `#${row.product}`)
        },
        {
          field: 'customer_name',
          label: t('reviews.listPage.schema.customer'),
          type: 'string',
          render: (value: unknown, row: Review): ReactNode => String(row.customer_name ?? value ?? '-')
        },
        {
          field: 'rating',
          label: t('reviews.listPage.schema.rating'),
          type: 'number',
          sortable: true,
          render: (value: number): ReactNode => renderStars(value ?? 0)
        },
        {
          field: 'title',
          label: t('reviews.listPage.schema.title'),
          type: 'string',
          render: (v: unknown): ReactNode => (v ? String(v) : '-')
        },
        {
          field: 'comment',
          label: t('reviews.listPage.schema.comment'),
          type: 'string',
          render: (v: unknown): ReactNode => {
            const s = v ? String(v) : ''
            return s.length > 60 ? `${s.slice(0, 60)}…` : s || '-'
          }
        },
        {
          field: 'is_approved',
          label: t('reviews.listPage.schema.status'),
          type: 'select',
          sortable: true,
          render: (value: unknown, row: Review): ReactNode => {
            const approved = row.is_approved ?? value
            return (
              <Chip
                label={approved ? t('reviews.status.approved') : t('reviews.status.pending')}
                size='small'
                color={approved ? 'success' : 'warning'}
                variant='filled'
              />
            )
          }
        },
        {
          field: 'helpful_count',
          label: t('reviews.listPage.schema.helpfulCount'),
          type: 'number',
          render: (v: unknown): ReactNode => (v != null ? Number(v) : 0)
        },
        {
          field: 'created_at',
          label: t('reviews.listPage.schema.createdAt'),
          type: 'datetime',
          sortable: true,
          render: (value: unknown): ReactNode => (value ? formatDate(value as string, 'yyyy-MM-dd') : '-')
        }
      ],
      filters: [
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
        },
        {
          field: 'product',
          label: t('reviews.listPage.filters.product.label'),
          type: 'select',
          filterMode: 'api',
          optionsSource: 'api',
          optionsApi: bfgApi.products(),
          optionsValueField: 'id',
          optionsLabelField: 'name'
        }
      ] as SchemaFilter[],
      searchFields: ['product_name', 'customer_name', 'title', 'comment'],
      actions: [
        { id: 'approve', label: t('reviews.listPage.actions.approve'), type: 'primary', scope: 'row', icon: 'tabler-check' },
        { id: 'reject', label: t('reviews.listPage.actions.reject'), type: 'secondary', scope: 'row', icon: 'tabler-x' },
        {
          id: 'delete',
          label: t('common.actions.delete'),
          type: 'danger',
          scope: 'row',
          confirm: t('reviews.listPage.actions.confirmDelete')
        }
      ] as SchemaAction[]
    }),
    [t]
  )

  const handleActionClick = useCallback(
    async (action: SchemaAction, item: Review | Record<string, unknown>) => {
      const review = item as Review
      if (review.id == null) return
      try {
        if (action.id === 'approve') {
          await approveReview(review.id)
          await refetch()
        } else if (action.id === 'reject') {
          await rejectReview(review.id)
          await refetch()
        } else if (action.id === 'delete') {
          await deleteReview(review.id)
          await refetch()
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('reviews.listPage.messages.actionFailed')
        alert(message)
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
        schema={schema}
        data={reviews || []}
        loading={loading}
        onActionClick={handleActionClick}
        basePath='/admin/store/reviews'
        filters={apiFilters}
        onFiltersChange={setApiFilters}
      />
    </Box>
  )
}
