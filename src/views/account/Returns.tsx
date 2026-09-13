'use client'

// React Imports
import { useCallback, useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import StatusBadge from '@/components/schema/StatusBadge'
import { AccountCard, AccountEmpty, AccountLoading, formatDay, useMoney } from '@/components/account/AccountUI'

// Utils Imports
import { getMediaUrl } from '@/utils/media'
import { meApi } from '@/utils/meApi'
import { listOf } from '@/views/account/shared/api'
import type { StorefrontOrder } from '@/views/account/shared/orders'
import {
  RETURN_REASONS,
  RETURN_STATE_TONE,
  returnUnits,
  returnValue,
  type CustomerReturn,
  type ReturnReason
} from '@/views/account/shared/returns'

/** A return that ended without taking the items back leaves them returnable again. */
const RELEASED = ['rejected', 'cancelled']

const HOW_IT_WORKS = ['request', 'send', 'refund'] as const

const Returns = () => {
  const t = useTranslations('account')
  const money = useMoney()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<StorefrontOrder[] | null>(null)
  const [returns, setReturns] = useState<CustomerReturn[] | null>(null)
  const [orderId, setOrderId] = useState<number | ''>('')
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [reason, setReason] = useState<ReturnReason | ''>('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadReturns = useCallback(async () => {
    try {
      setReturns(listOf<CustomerReturn>(await meApi.getReturns({ page_size: 50 })))
    } catch {
      setReturns([])
    }
  }, [])

  useEffect(() => {
    meApi
      .getOrders({ status: 'delivered', page_size: 50 })
      .then(response => setOrders(listOf<StorefrontOrder>(response)))
      .catch(err => {
        setOrders([])
        setError(err instanceof Error ? err.message : t('common.loadFailed'))
      })
    loadReturns()
  }, [loadReturns, t])

  // Arriving from an order's "Request a return" picks that order.
  useEffect(() => {
    const requested = Number(searchParams.get('order'))

    if (orders && requested && orders.some(candidate => candidate.id === requested)) {
      setOrderId(requested)
    }
  }, [orders, searchParams])

  const order = useMemo(() => orders?.find(candidate => candidate.id === orderId) ?? null, [orders, orderId])

  /**
   * Units of each order item already in a live return for this order. The server checks
   * one return at a time, so without this a second request could claim the same units.
   */
  const alreadyReturned = useMemo(() => {
    const totals: Record<number, number> = {}

    for (const request of returns ?? []) {
      if (request.order !== orderId || RELEASED.includes(request.status)) continue

      for (const line of request.items ?? []) {
        totals[line.order_item] = (totals[line.order_item] ?? 0) + line.quantity
      }
    }

    return totals
  }, [returns, orderId])

  const lines = (order?.items ?? []).flatMap(item => {
    const quantity = item.id ? picked[item.id] ?? 0 : 0

    return item.id && quantity > 0 ? [{ id: item.id, price: Number(item.price ?? 0), quantity }] : []
  })
  const estimate = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const itemsSelectable = (order?.items ?? []).some(item => Boolean(item.id))
  const canSubmit = Boolean(order && reason && lines.length > 0 && !submitting)

  const chooseOrder = (value: number | '') => {
    setOrderId(value)
    setPicked({})
    setSuccess(null)
  }

  const setQuantity = (itemId: number, quantity: number) => setPicked(current => ({ ...current, [itemId]: quantity }))

  const reset = () => {
    setOrderId('')
    setPicked({})
    setReason('')
    setNote('')
  }

  const submit = async () => {
    if (!order || !reason || lines.length === 0) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    let created: CustomerReturn | null = null

    try {
      created = (await meApi.createReturn({
        order: order.id,
        reason_category: reason,
        customer_note: note.trim()
      })) as CustomerReturn

      const reasonLabel = t(`returns.reasons.${reason}`)

      for (const line of lines) {
        await meApi.addReturnItem({
          return_request: created.id,
          order_item: line.id,
          quantity: line.quantity,
          reason: reasonLabel
        })
      }

      setSuccess(t('returns.form.submitted', { number: created.return_number }))
      reset()
    } catch (err) {
      setError(
        created
          ? t('returns.form.partialFailure', { number: created.return_number })
          : err instanceof Error
            ? err.message
            : t('returns.form.failed')
      )
    } finally {
      setSubmitting(false)
      loadReturns()
    }
  }

  return (
    <div className='acc-grid'>
      <AccountCard title={t('returns.form.title')}>
        <div className='acc-form'>
          {success && (
            <Alert severity='success' onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div>
            <div className='acc-field-label'>
              <span className='acc-num-dot'>1</span>
              {t('returns.form.order')}
            </div>
            {orders === null ? (
              <AccountLoading />
            ) : orders.length === 0 ? (
              <div className='acc-sub'>{t('returns.form.noEligible')}</div>
            ) : (
              <CustomTextField
                select
                fullWidth
                value={orderId}
                onChange={event => chooseOrder(event.target.value === '' ? '' : Number(event.target.value))}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value=''>{t('returns.form.chooseOrder')}</MenuItem>
                {orders.map(candidate => (
                  <MenuItem key={candidate.id} value={candidate.id}>
                    {t('returns.form.orderOption', {
                      number: candidate.order_number || `#${candidate.id}`,
                      date: formatDay(candidate.timestamps?.delivered_at || candidate.timestamps?.updated_at),
                      total: money(candidate.amounts?.total)
                    })}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          </div>

          {order && (
            <div>
              <div className='acc-field-label'>
                <span className='acc-num-dot'>2</span>
                {t('returns.form.items')}
              </div>
              {itemsSelectable ? (
                <div className='acc-picker'>
                  {(order.items ?? []).map((item, index) => {
                    const itemId = item.id

                    if (!itemId) return null

                    const available = Math.max(0, (item.quantity ?? 0) - (alreadyReturned[itemId] ?? 0))
                    const quantity = Math.min(picked[itemId] ?? 0, available)

                    return (
                      <div key={itemId ?? index} className='acc-row'>
                        <Checkbox
                          size='small'
                          sx={{ p: 0.5, ml: -0.5 }}
                          checked={quantity > 0}
                          disabled={available === 0}
                          onChange={event => setQuantity(itemId, event.target.checked ? 1 : 0)}
                          inputProps={{ 'aria-label': item.product_name }}
                        />
                        <span className='acc-thumb acc-thumb--lg'>
                          {item.image_url ? <img src={getMediaUrl(item.image_url)} alt='' /> : <Icon icon='tabler-photo' />}
                        </span>
                        <div className='acc-grow'>
                          <div className='acc-medium acc-truncate'>{item.product_name || t('orders.unknownProduct')}</div>
                          <div className='acc-sub'>
                            {available === 0
                              ? t('returns.form.alreadyReturned')
                              : t('returns.form.bought', { price: money(item.price), count: item.quantity ?? 0 })}
                          </div>
                        </div>
                        <div className='acc-qty'>
                          <button
                            type='button'
                            disabled={quantity <= 0}
                            aria-label={t('returns.form.less')}
                            onClick={() => setQuantity(itemId, quantity - 1)}
                          >
                            <Icon icon='tabler-minus' />
                          </button>
                          <span className='acc-qty-value'>{quantity}</span>
                          <button
                            type='button'
                            disabled={quantity >= available}
                            aria-label={t('returns.form.more')}
                            onClick={() => setQuantity(itemId, quantity + 1)}
                          >
                            <Icon icon='tabler-plus' />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Alert
                  severity='info'
                  action={
                    <Button
                      size='small'
                      component={Link}
                      href={`/account/support?order=${encodeURIComponent(order.order_number || String(order.id))}`}
                    >
                      {t('actions.getHelp')}
                    </Button>
                  }
                >
                  {t('returns.form.noItemIds')}
                </Alert>
              )}
            </div>
          )}

          <div>
            <div className='acc-field-label'>
              <span className='acc-num-dot'>3</span>
              {t('returns.form.reason')}
            </div>
            <CustomTextField
              select
              fullWidth
              value={reason}
              onChange={event => setReason(event.target.value as ReturnReason | '')}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value=''>{t('returns.form.chooseReason')}</MenuItem>
              {RETURN_REASONS.map(code => (
                <MenuItem key={code} value={code}>
                  {t(`returns.reasons.${code}`)}
                </MenuItem>
              ))}
            </CustomTextField>
          </div>

          <div>
            <div className='acc-field-label'>
              <span className='acc-num-dot'>4</span>
              {t('returns.form.details')}
            </div>
            <CustomTextField
              fullWidth
              multiline
              minRows={3}
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder={t('returns.form.detailsPlaceholder')}
            />
          </div>
        </div>

        <div className='acc-card-foot'>
          <span className='acc-sub'>
            {t('returns.form.estimate')} <span className='acc-strong acc-tnum'>{money(estimate)}</span>
          </span>
          <div className='acc-page-actions'>
            <Button onClick={reset} disabled={submitting}>
              {t('returns.form.reset')}
            </Button>
            <Button variant='contained' onClick={submit} disabled={!canSubmit}>
              {submitting ? t('returns.form.submitting') : t('returns.form.submit')}
            </Button>
          </div>
        </div>
      </AccountCard>

      <div className='acc-col'>
        <AccountCard
          title={t('returns.list.title')}
          action={returns && returns.length > 0 ? <span className='acc-sub'>{returns.length}</span> : undefined}
        >
          {returns === null ? (
            <AccountLoading />
          ) : returns.length === 0 ? (
            <AccountEmpty icon='tabler-receipt-refund' title={t('returns.list.empty')} />
          ) : (
            returns.map(request => (
              <div key={request.id} className='acc-row acc-row--top'>
                <div className='acc-grow'>
                  <div className='acc-strong acc-tnum'>{request.return_number}</div>
                  <div className='acc-sub'>
                    {[request.order_number, t('common.units', { count: returnUnits(request) }), formatDay(request.created_at)]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <div className='acc-meta'>
                  <StatusBadge label={t(`returnState.${request.status}`)} color={RETURN_STATE_TONE[request.status] ?? 'default'} />
                  <span className='acc-sub acc-tnum'>
                    {request.status === 'rejected' ? t('returns.list.noRefund') : money(returnValue(request))}
                  </span>
                </div>
              </div>
            ))
          )}
        </AccountCard>

        <AccountCard title={t('returns.how.title')}>
          <div className='acc-card-body acc-stack'>
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step} className='acc-howto'>
                <span className='acc-num-dot'>{index + 1}</span>
                <div>
                  <div className='acc-medium'>{t(`returns.how.${step}`)}</div>
                  <div className='acc-sub'>{t(`returns.how.${step}Hint`)}</div>
                </div>
              </div>
            ))}
          </div>
        </AccountCard>
      </div>
    </div>
  )
}

export default Returns
