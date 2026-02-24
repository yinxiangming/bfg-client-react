'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import CouponEditDialog from './CouponEditDialog'
import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CouponPayload
} from '@/services/marketing'

const buildCouponsSchema = (t: any): ListSchema => ({
  title: t('settings.marketing.coupons.tab.title'),
  columns: [
    { field: 'code', label: t('settings.marketing.coupons.tab.columns.code'), type: 'string', sortable: true, link: 'edit' },
    {
      field: 'discount',
      label: t('settings.marketing.coupons.tab.columns.discount'),
      type: 'string',
      render: (_v, row) => {
        // Note: discount info comes from discount_rule, may need to fetch separately
        return '-'
      }
    },
    { field: 'valid_from', label: t('settings.marketing.coupons.tab.columns.validFrom'), type: 'date', sortable: true },
    { field: 'valid_until', label: t('settings.marketing.coupons.tab.columns.validTo'), type: 'date', sortable: true },
    { field: 'usage_limit', label: t('settings.marketing.coupons.tab.columns.usageLimit'), type: 'number' },
    { field: 'times_used', label: t('settings.marketing.coupons.tab.columns.used'), type: 'number' },
    { field: 'is_active', label: t('settings.marketing.coupons.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['code'],
  actions: [
    { id: 'add', label: t('settings.marketing.coupons.tab.actions.newCoupon'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.marketing.coupons.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.marketing.coupons.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.coupons.tab.actions.confirmDelete')
    }
  ]
})

const CouponsTab = () => {
  const t = useTranslations('admin')
  const couponsSchema = useMemo(() => buildCouponsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Coupon[]>({
    fetchFn: async () => {
      const result = await getCoupons()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Coupon | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Coupon | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Coupon)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCoupon((item as Coupon).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.coupons.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CouponPayload) => {
    try {
      if (selected) {
        await updateCoupon(selected.id, payload)
      } else {
        await createCoupon(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.marketing.coupons.tab.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <SchemaTable
        schema={couponsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCoupon(typeof id === 'string' ? parseInt(id) : id)}
      />
      <CouponEditDialog
        open={editOpen}
        coupon={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default CouponsTab
