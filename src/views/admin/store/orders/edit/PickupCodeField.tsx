'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import CustomTextField from '@/components/ui/TextField'
import { updateOrder } from '@/services/store'

type Props = {
  orderId: number
  value?: string
  /** Refetch after saving, so whatever is showing the order agrees with it. */
  onSaved?: () => void | Promise<void>
}

/**
 * The code the customer quotes on collection, edited in place.
 *
 * Shared by the order page's pickup card and the fulfilment dialog: the same
 * field in both, so the operator does not have to remember which screen can
 * save it.
 */
const PickupCodeField = ({ orderId, value, onSaved }: Props) => {
  const t = useTranslations('admin')
  const [code, setCode] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The order can be refetched under us; follow the server unless mid-edit.
  useEffect(() => { setCode(value || '') }, [value])

  const dirty = (value || '') !== code

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateOrder(orderId, { pickup_code: code.trim() })
      await onSaved?.()
    } catch (err: any) {
      setError(err?.message || t('orders.delivery.pickup.saveCodeFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
      <CustomTextField
        label={t('orders.delivery.pickup.codeLabel')}
        value={code}
        onChange={(e: any) => setCode(e.target.value)}
        helperText={error || t('orders.delivery.pickup.codeHelp')}
        error={Boolean(error)}
        disabled={saving}
        fullWidth
      />
      {dirty && (
        <Button variant='contained' size='small' onClick={handleSave} disabled={saving}>
          {t('common.actions.save')}
        </Button>
      )}
    </Box>
  )
}

export default PickupCodeField
