'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Coupon, CouponPayload } from '@/services/marketing'
import { bfgApi } from '@/utils/api'

type CouponEditDialogProps = {
  open: boolean
  coupon: Coupon | null
  onClose: () => void
  onSave: (data: CouponPayload) => Promise<void> | void
}

const buildCouponFormSchema = (t: any): FormSchema => ({
  title: t('settings.marketing.coupons.editDialog.title'),
  fields: [
    { field: 'code', label: t('settings.marketing.coupons.editDialog.fields.code'), type: 'string', required: true },
    { field: 'description', label: t('settings.marketing.coupons.editDialog.fields.description'), type: 'textarea' },
    {
      field: 'discount_rule_id',
      label: t('settings.marketing.coupons.editDialog.fields.discountRuleId'),
      type: 'number',
      required: true,
      placeholder: t('settings.marketing.coupons.editDialog.placeholders.discountRuleId')
    },
    {
      field: 'campaign_id',
      label: t('settings.marketing.coupons.editDialog.fields.campaignOptional'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.campaigns(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'valid_from', label: t('settings.marketing.coupons.editDialog.fields.validFrom'), type: 'datetime', required: true },
    { field: 'valid_until', label: t('settings.marketing.coupons.editDialog.fields.validTo'), type: 'datetime' },
    { field: 'usage_limit', label: t('settings.marketing.coupons.editDialog.fields.usageLimit'), type: 'number' },
    { field: 'usage_limit_per_customer', label: t('settings.marketing.coupons.editDialog.fields.usageLimitPerCustomer'), type: 'number' },
    { field: 'is_active', label: t('settings.marketing.coupons.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const CouponEditDialog = ({ open, coupon, onClose, onSave }: CouponEditDialogProps) => {
  const t = useTranslations('admin')
  const couponFormSchema = useMemo(() => buildCouponFormSchema(t), [t])

  const initialData: Partial<Coupon> = coupon
    ? coupon
    : {
        code: '',
        valid_from: new Date().toISOString(),
        is_active: true
      }

  const handleSubmit = async (data: Partial<Coupon>) => {
    const payload: CouponPayload = {
      code: data.code || '',
      description: data.description,
      discount_rule_id: Number(data.discount_rule_id),
      campaign_id: data.campaign_id ? Number(data.campaign_id) : undefined,
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until,
      usage_limit: data.usage_limit ? Number(data.usage_limit) : undefined,
      usage_limit_per_customer: data.usage_limit_per_customer ? Number(data.usage_limit_per_customer) : undefined,
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={couponFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default CouponEditDialog
