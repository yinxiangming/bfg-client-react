'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// Next Imports
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import StatusBadge from '@/components/schema/StatusBadge'
import PayOrderDialog from '@/components/payments/PayOrderDialog'
import {
  AccountCard,
  AccountLoading,
  AccountPageHeader,
  formatDay,
  formatDayTime,
  formatShortDayTime,
  useMoney
} from '@/components/account/AccountUI'

// Utils Imports
import { useAccount } from '@/contexts/AccountContext'
import { usePageSlots } from '@/extensions/hooks/usePageSections'
import { getMediaUrl } from '@/utils/media'
import { meApi } from '@/utils/meApi'
import { listOf } from '@/views/account/shared/api'
import {
  ORDER_STATE_TONE,
  addressLines,
  canCancel,
  canReturn,
  getOrderState,
  isPickupOrder,
  needsPayment,
  trackingNumbers,
  unitCount,
  type BadgeTone,
  type StorefrontAddress,
  type StorefrontOrder
} from '@/views/account/shared/orders'

type OrderPayment = {
  id: number
  payment_number?: string
  gateway_name?: string
  payment_method_display?: string
  amount?: string
  currency_code?: string
  status?: string
  created_at?: string
  completed_at?: string | null
}

type OrderInvoice = {
  id: number
  invoice_number: string
  status?: string
  total?: string
  currency_code?: string
  issue_date?: string
}

const PAYMENT_TONE: Record<string, BadgeTone> = {
  completed: 'success',
  paid: 'success',
  pending: 'warning',
  processing: 'warning',
  failed: 'error',
  cancelled: 'default',
  refunded: 'default'
}

/** How far along fulfilment each order status is: placed, paid, processing, shipped/ready, delivered/collected. */
const REACHED: Record<string, number> = { pending: 0, processing: 2, shipped: 3, ready_for_pickup: 3, delivered: 4 }

const amount = (value?: string | number | null) => Number(value ?? 0) || 0

const sameAddress = (a?: StorefrontAddress | null, b?: StorefrontAddress | null) =>
  [a?.full_name, ...addressLines(a)].join('\n') === [b?.full_name, ...addressLines(b)].join('\n')

type AddressBlockProps = { address: StorefrontAddress }

const AddressBlock = ({ address }: AddressBlockProps) => (
  <div className='acc-card-body acc-text'>
    {address.full_name && <div className='acc-strong'>{address.full_name}</div>}
    {addressLines(address).map(line => (
      <div key={line}>{line}</div>
    ))}
    {address.phone && <div className='acc-sub mbs-1.5'>{address.phone}</div>}
  </div>
)

interface OrderDetailProps {
  orderId: number
}

const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const t = useTranslations('account')
  const money = useMoney()
  const { refreshStats } = useAccount()
  const { beforeSlots, afterSlots } = usePageSlots('account/orders/detail')

  const [order, setOrder] = useState<StorefrontOrder | null>(null)
  const [payments, setPayments] = useState<OrderPayment[]>([])
  const [invoices, setInvoices] = useState<OrderInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (Number.isNaN(orderId)) {
      setError(t('orderDetail.notFound'))
      setLoading(false)

      return
    }

    try {
      setError(null)
      setOrder(await meApi.getOrder(orderId))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orderDetail.failedLoad'))
    } finally {
      setLoading(false)
    }

    meApi
      .getPayments({ order_id: orderId })
      .then(response => setPayments(listOf<OrderPayment>(response)))
      .catch(() => setPayments([]))
    meApi
      .getInvoices({ order_id: orderId })
      .then(response => setInvoices(listOf<OrderInvoice>(response)))
      .catch(() => setInvoices([]))
  }, [orderId, t])

  useEffect(() => {
    load()
  }, [load])

  // "Track parcel" and "Pickup code" link to #tracking / #pickup, which only exist once the order is in.
  useEffect(() => {
    if (!order || !window.location.hash) return

    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [order])

  const refreshAfterChange = () => {
    load()
    refreshStats()
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setNotice(t('orderDetail.copied'))
    } catch {
      // Clipboard access denied; the value is on screen to copy by hand.
    }
  }

  const downloadInvoice = async (invoice: OrderInvoice) => {
    setDownloading(invoice.id)

    try {
      const blob = await meApi.downloadInvoice(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `${invoice.invoice_number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orderDetail.failedDownloadInvoice'))
    } finally {
      setDownloading(null)
    }
  }

  const handleCancel = async () => {
    if (!order) return

    setCancelling(true)

    try {
      await meApi.cancelOrder(order.id, { reason: cancelReason.trim() })
      refreshAfterChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.failedCancel'))
    } finally {
      setCancelling(false)
      setCancelOpen(false)
    }
  }

  if (loading) return <AccountLoading />

  if (!order) {
    return <Alert severity='error'>{error || t('orderDetail.notFound')}</Alert>
  }

  const state = getOrderState(order)
  const pickup = isPickupOrder(order)
  const number = order.order_number || `#${order.id}`
  const status = (order.status ?? '').toLowerCase()
  const timestamps = order.timestamps ?? {}
  const amounts = order.amounts ?? {}
  const items = order.items ?? []
  const tracking = trackingNumbers(order)
  const closed = state === 'cancelled' || state === 'refunded'
  const paid = ['paid', 'refunded'].includes((order.payment_status ?? '').toLowerCase())
  const deliveryLabel = pickup ? t('orders.pickup') : order.freight_service?.name || t('orders.shipping')
  const supportHref = `/account/support?order=${encodeURIComponent(number)}`
  const service = order.freight_service
  const estimate =
    service?.estimated_days_min && service?.estimated_days_max
      ? t('orderDetail.estimatedDays', { min: service.estimated_days_min, max: service.estimated_days_max })
      : null

  // Payment is its own step while it is still the thing to do. An order that has moved on
  // without it (cash on delivery, invoiced) skips the step rather than showing it unticked.
  const reached = REACHED[status] ?? 0
  const steps = [
    { key: 'placed', done: true, time: timestamps.created_at },
    ...(paid || reached < 2 ? [{ key: 'paid', done: paid, time: timestamps.paid_at }] : []),
    { key: 'processing', done: reached >= 2, time: null },
    { key: pickup ? 'ready' : 'shipped', done: reached >= 3, time: pickup ? null : timestamps.shipped_at },
    { key: pickup ? 'collected' : 'delivered', done: reached >= 4, time: timestamps.delivered_at }
  ]
  const nowIndex = steps.findIndex(step => !step.done)

  let aside: ReactNode = null

  if (pickup && order.pickup_code) {
    aside = (
      <div id='pickup' className='acc-progress-aside'>
        <div className='acc-sub'>{t('orderDetail.pickupCode')}</div>
        <div className='acc-copy'>
          <span className='acc-copy-value'>{order.pickup_code}</span>
          <IconButton size='small' aria-label={t('orderDetail.copy')} onClick={() => copy(order.pickup_code ?? '')}>
            <Icon icon='tabler-copy' />
          </IconButton>
        </div>
        {order.pickup_point?.name && <div className='acc-sub'>{order.pickup_point.name}</div>}
      </div>
    )
  } else if (tracking.length > 0) {
    aside = (
      <div id='tracking' className='acc-progress-aside'>
        {tracking.map(consignment => (
          <div key={consignment.id}>
            <div className='acc-sub'>
              {consignment.carrier_name
                ? t('orderDetail.trackingWith', { carrier: consignment.carrier_name })
                : t('orderDetail.trackingNumber')}
            </div>
            <div className='acc-copy'>
              <span className='acc-copy-value'>{consignment.tracking_number}</span>
              <IconButton
                size='small'
                aria-label={t('orderDetail.copy')}
                onClick={() => copy(consignment.tracking_number)}
              >
                <Icon icon='tabler-copy' />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    )
  } else if (!pickup && !closed) {
    aside = (
      <div className='acc-progress-aside'>
        <div className='acc-sub'>{t('orderDetail.deliveryMethod')}</div>
        <div className='acc-strong'>{deliveryLabel}</div>
        {estimate && <div className='acc-sub'>{estimate}</div>}
      </div>
    )
  }

  const shipping = order.addresses?.shipping
  const billing = order.addresses?.billing
  const shippingCost = amount(amounts.shipping_cost)
  const discount = amount(amounts.discount)
  const tax = amount(amounts.tax)
  const events = [...(order.activities ?? [])].reverse()

  return (
    <div className='acc-page'>
      {beforeSlots.map(ext => ext.component && <ext.component key={ext.id} order={order} orderId={orderId} />)}

      <AccountPageHeader
        back={{ href: '/account/orders', label: t('nav.orders') }}
        title={number}
        badges={
          <>
            <StatusBadge label={t(`orderState.${state}`)} color={ORDER_STATE_TONE[state]} />
            {paid && !closed && <StatusBadge label={t('orderDetail.paid')} color='success' />}
          </>
        }
        subtitle={[
          t('orderDetail.placed', { date: formatDayTime(timestamps.created_at) }),
          t('common.units', { count: unitCount(order) }),
          deliveryLabel
        ].join(' · ')}
        actions={
          <>
            {needsPayment(order) && (
              <Button variant='contained' startIcon={<Icon icon='tabler-credit-card' />} onClick={() => setPayOpen(true)}>
                {t('actions.payNow')}
              </Button>
            )}
            {canReturn(order) && (
              <Button
                variant='outlined'
                component={Link}
                href={`/account/returns?order=${order.id}`}
                startIcon={<Icon icon='tabler-arrow-back-up' />}
              >
                {t('actions.requestReturn')}
              </Button>
            )}
            <IconButton
              aria-label={t('actions.moreActions')}
              onClick={event => setMenuAnchor(event.currentTarget)}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <Icon icon='tabler-dots-vertical' />
            </IconButton>
          </>
        }
      />

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <section className='acc-card acc-progress'>
        <div className='acc-progress-steps'>
          {closed ? (
            <div className='acc-copy'>
              <span className={`acc-ico acc-ico--sm ${state === 'cancelled' ? 'acc-ico--err' : 'acc-ico--neu'}`}>
                <Icon icon={state === 'cancelled' ? 'tabler-circle-x' : 'tabler-receipt-refund'} />
              </span>
              <div className='acc-grow'>
                <div className='acc-strong'>
                  {state === 'cancelled' ? t('orderDetail.cancelledNotice') : t('orderDetail.refundedNotice')}
                </div>
                <div className='acc-sub'>{formatDayTime(timestamps.updated_at)}</div>
              </div>
            </div>
          ) : (
            <div className='acc-steps' style={{ '--acc-steps': steps.length } as CSSProperties}>
              {steps.map((step, index) => {
                const next = steps[index + 1]
                const barClass = next?.done
                  ? 'acc-step-bar acc-step-bar--done'
                  : step.done && index + 1 === nowIndex
                    ? 'acc-step-bar acc-step-bar--half'
                    : 'acc-step-bar'
                const dotClass = step.done
                  ? 'acc-step-dot acc-step-dot--done'
                  : index === nowIndex
                    ? 'acc-step-dot acc-step-dot--now'
                    : 'acc-step-dot'
                const hint = index === nowIndex && step.key === 'delivered' ? estimate : null

                return (
                  <div key={step.key} className={step.done ? 'acc-step' : 'acc-step acc-step--todo'}>
                    <div className='acc-step-head'>
                      <span className={dotClass}>{step.done && <Icon icon='tabler-check' />}</span>
                      {next && <span className={barClass} />}
                    </div>
                    <div className='acc-step-label'>{t(`orderDetail.steps.${step.key}`)}</div>
                    <div className='acc-sub acc-step-time'>
                      {step.time ? formatShortDayTime(step.time) : hint || ' '}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {aside}
      </section>

      <div className='acc-grid'>
        <div className='acc-col'>
          <AccountCard
            title={t('orderDetail.items')}
            action={
              <span className='acc-sub'>
                {t('orderDetail.itemsSummary', {
                  products: t('common.products', { count: items.length }),
                  units: t('common.units', { count: unitCount(order) })
                })}
              </span>
            }
          >
            {items.length === 0 ? (
              <div className='acc-card-body acc-sub'>{t('orderDetail.noItems')}</div>
            ) : (
              items.map((item, index) => (
                <div key={item.id ?? index} className='acc-row'>
                  <span className='acc-thumb acc-thumb--lg'>
                    {item.image_url ? <img src={getMediaUrl(item.image_url)} alt='' /> : <Icon icon='tabler-photo' />}
                  </span>
                  <div className='acc-grow'>
                    <div className='acc-medium acc-truncate'>{item.product_name || t('orders.unknownProduct')}</div>
                    <div className='acc-sub'>
                      {[item.variant_name, t('orderDetail.each', { price: money(item.price) })].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className='acc-sub acc-tnum acc-qty-label'>× {item.quantity ?? 0}</div>
                  <div className='acc-medium acc-tnum acc-line-total'>{money(item.subtotal)}</div>
                </div>
              ))
            )}
          </AccountCard>

          <AccountCard title={t('orderDetail.orderActivity')}>
            {events.length === 0 ? (
              <div className='acc-card-body acc-sub'>{t('orderDetail.noActivity')}</div>
            ) : (
              <div className='acc-timeline'>
                {events.map((event, index) => (
                  <div key={event.id} className='acc-event'>
                    <span className={index === 0 ? 'acc-event-dot acc-event-dot--on' : 'acc-event-dot'} />
                    <div className='acc-grow'>
                      <div className='acc-medium'>{event.title}</div>
                      {event.description && event.description !== event.title && (
                        <div className='acc-sub'>{event.description}</div>
                      )}
                      <div className='acc-sub acc-show-sm'>{formatDayTime(event.time)}</div>
                    </div>
                    <div className='acc-sub acc-tnum acc-hide-sm'>{formatDayTime(event.time)}</div>
                  </div>
                ))}
              </div>
            )}
          </AccountCard>

          {order.customer_note?.trim() && (
            <AccountCard title={t('orderDetail.customerNote')}>
              <div className='acc-card-body acc-text acc-pre'>{order.customer_note}</div>
            </AccountCard>
          )}
        </div>

        <div className='acc-col'>
          <AccountCard title={t('orderDetail.summary')}>
            <div className='acc-card-body acc-stack'>
              <div className='acc-kv'>
                <span>{t('orderDetail.subtotal')}</span>
                <span className='acc-tnum'>{money(amounts.subtotal)}</span>
              </div>
              {(shippingCost > 0 || !pickup) && (
                <div className='acc-kv'>
                  <span>{t('orderDetail.shipping')}</span>
                  <span className='acc-tnum'>{money(shippingCost)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className='acc-kv'>
                  <span>{t('orderDetail.discount')}</span>
                  <span className='acc-tnum'>-{money(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className='acc-kv'>
                  <span>{t('orderDetail.tax')}</span>
                  <span className='acc-tnum'>{money(tax)}</span>
                </div>
              )}
              <div className='acc-rule' />
              <div className='acc-kv acc-kv--total'>
                <span>{t('orderDetail.total')}</span>
                <span className='acc-tnum'>{money(amounts.total)}</span>
              </div>
            </div>
            {(payments.length > 0 || invoices.length > 0) && (
              <div className='acc-divided'>
                {payments.map(payment => {
                  const paymentStatus = (payment.status ?? '').toLowerCase()

                  return (
                    <div key={`payment-${payment.id}`} className='acc-row'>
                      <span className='acc-ico acc-ico--sm acc-ico--neu'>
                        <Icon icon='tabler-credit-card' />
                      </span>
                      <div className='acc-grow'>
                        <div className='acc-medium acc-truncate'>
                          {payment.payment_method_display || payment.gateway_name || t('orderDetail.payment')}
                        </div>
                        <div className='acc-sub'>
                          {formatDay(payment.completed_at || payment.created_at)} · {money(payment.amount, payment.currency_code)}
                        </div>
                      </div>
                      <StatusBadge
                        label={t.has(`orderDetail.paymentRecord.${paymentStatus}`) ? t(`orderDetail.paymentRecord.${paymentStatus}`) : payment.status}
                        color={PAYMENT_TONE[paymentStatus] ?? 'default'}
                      />
                    </div>
                  )
                })}
                {invoices.map(invoice => (
                  <div key={`invoice-${invoice.id}`} className='acc-row'>
                    <span className='acc-ico acc-ico--sm acc-ico--neu'>
                      <Icon icon='tabler-file-invoice' />
                    </span>
                    <div className='acc-grow'>
                      <div className='acc-medium'>{t('orderDetail.taxInvoice')}</div>
                      <div className='acc-sub acc-truncate'>
                        {invoice.invoice_number} · {formatDay(invoice.issue_date)}
                      </div>
                    </div>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<Icon icon='tabler-download' />}
                      disabled={downloading === invoice.id}
                      onClick={() => downloadInvoice(invoice)}
                    >
                      {t('orderDetail.download')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AccountCard>

          {pickup ? (
            <AccountCard title={t('orderDetail.pickupPoint')}>
              {order.pickup_point ? (
                <div className='acc-card-body acc-text'>
                  {order.pickup_point.name && <div className='acc-strong'>{order.pickup_point.name}</div>}
                  {order.pickup_point.address && <div className='acc-pre'>{order.pickup_point.address}</div>}
                  {order.pickup_point.phone && <div className='acc-sub mbs-1.5'>{order.pickup_point.phone}</div>}
                  {order.pickup_point.instructions && (
                    <div className='acc-sub acc-pre mbs-1.5'>{order.pickup_point.instructions}</div>
                  )}
                </div>
              ) : (
                <div className='acc-card-body acc-sub'>{t('orderDetail.pickupNoAddress')}</div>
              )}
            </AccountCard>
          ) : (
            shipping && (
              <AccountCard
                title={t('orderDetail.deliveryAddress')}
                action={service?.name ? <StatusBadge label={service.name} noDot /> : undefined}
              >
                <AddressBlock address={shipping} />
              </AccountCard>
            )
          )}

          {billing && !sameAddress(billing, shipping) && (
            <AccountCard title={t('orderDetail.billingAddress')}>
              <AddressBlock address={billing} />
            </AccountCard>
          )}

          <AccountCard title={t('orderDetail.helpTitle')}>
            {['shipped', 'ready_for_pickup', 'delivered'].includes(state) && (
              <Link href={`${supportHref}&topic=delivery`} className='acc-row'>
                <Icon icon='tabler-truck-delivery' className='acc-lead' />
                <span className='acc-grow acc-medium'>{t('orderDetail.helpDelivery')}</span>
                <Icon icon='tabler-chevron-right' className='acc-chev' />
              </Link>
            )}
            {canReturn(order) && (
              <Link href={`/account/returns?order=${order.id}`} className='acc-row'>
                <Icon icon='tabler-arrow-back-up' className='acc-lead' />
                <span className='acc-grow acc-medium'>{t('actions.requestReturn')}</span>
                <Icon icon='tabler-chevron-right' className='acc-chev' />
              </Link>
            )}
            <Link href={supportHref} className='acc-row'>
              <Icon icon='tabler-message-circle' className='acc-lead' />
              <span className='acc-grow acc-medium'>{t('orderDetail.helpQuestion')}</span>
              <Icon icon='tabler-chevron-right' className='acc-chev' />
            </Link>
          </AccountCard>
        </div>
      </div>

      {afterSlots.map(ext => ext.component && <ext.component key={ext.id} order={order} orderId={orderId} />)}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem component={Link} href={supportHref} onClick={() => setMenuAnchor(null)}>
          {t('actions.getHelp')}
        </MenuItem>
        {canCancel(order) && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setCancelReason('')
              setCancelOpen(true)
              setMenuAnchor(null)
            }}
          >
            {t('actions.cancelOrder')}
          </MenuItem>
        )}
      </Menu>

      {payOpen && (
        <PayOrderDialog
          open
          order={order}
          onClose={() => setPayOpen(false)}
          onPaymentSuccess={() => {
            setPayOpen(false)
            setNotice(t('orderDetail.paymentSuccessful'))
            refreshAfterChange()
          }}
        />
      )}

      <Dialog open={cancelOpen} onClose={() => !cancelling && setCancelOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('orders.cancelOrder')}</DialogTitle>
        <DialogContent>
          <p className='acc-text mbe-4'>{t('orders.cancelConfirm')}</p>
          <CustomTextField
            fullWidth
            multiline
            rows={3}
            label={t('orders.reason')}
            value={cancelReason}
            onChange={event => setCancelReason(event.target.value)}
            placeholder={t('orders.reasonPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>
            {t('orders.keepOrder')}
          </Button>
          <Button variant='contained' color='error' onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t('orders.cancelling') : t('orders.cancelOrder')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  )
}

export default OrderDetail
