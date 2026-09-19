'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import StatusBadge from '@/components/schema/StatusBadge'
import PayOrderDialog from '@/components/payments/PayOrderDialog'
import { AccountCard, AccountEmpty, AccountLoading, formatDay, useMoney } from '@/components/account/AccountUI'

// Utils Imports
import { useAccount } from '@/contexts/AccountContext'
import { meApi } from '@/utils/meApi'
import { getMediaUrl } from '@/utils/media'
import { listOf } from '@/views/account/shared/api'
import {
  ORDER_STATE_TONE,
  canCancel,
  canReturn,
  getOrderState,
  isPickupOrder,
  needsPayment,
  trackingNumbers,
  type StorefrontOrder
} from '@/views/account/shared/orders'

const PAGE_SIZE = 10

/** The order statuses the list filters on, in the order an order moves through them. */
const STATUSES = ['pending', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'cancelled', 'refunded']

/** Up to five page numbers around the current one. */
const pageWindow = (page: number, pages: number) => {
  const start = Math.max(1, Math.min(page - 2, pages - 4))

  return Array.from({ length: Math.min(5, pages) }, (_, index) => start + index)
}

const Orders = () => {
  const t = useTranslations('account')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const money = useMoney()
  const { stats, refreshStats } = useAccount()

  const requestedStatus = searchParams.get('status') ?? ''
  const status = STATUSES.includes(requestedStatus) ? requestedStatus : ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ anchor: HTMLElement; order: StorefrontOrder } | null>(null)
  const [payOrder, setPayOrder] = useState<StorefrontOrder | null>(null)
  const [cancelTarget, setCancelTarget] = useState<StorefrontOrder | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await meApi.getOrders({ status: status || undefined, page, page_size: PAGE_SIZE })
      const rows = listOf<StorefrontOrder>(response)

      setOrders(rows)
      setTotal(response.count ?? rows.length)
    } catch (err) {
      setOrders([])
      setTotal(0)
      setError(err instanceof Error ? err.message : t('orders.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [status, page, t])

  useEffect(() => {
    load()
  }, [load])

  /** The tab and page live in the URL, so a dashboard link can open a filtered list. */
  const navigate = (next: { status?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (next.status !== undefined) {
      if (next.status) params.set('status', next.status)
      else params.delete('status')
      params.delete('page')
    }

    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page))
      else params.delete('page')
    }

    const query = params.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const refreshAfterChange = () => {
    load()
    refreshStats()
  }

  const handleCancel = async () => {
    if (!cancelTarget) return

    setCancelling(true)

    try {
      await meApi.cancelOrder(cancelTarget.id, { reason: cancelReason.trim() })
      refreshAfterChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.failedCancel'))
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  const counts = stats?.order_counts ?? {}
  const allCount = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0)
  const tabs = STATUSES.filter(key => (counts[key] ?? 0) > 0 || key === status)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(total, page * PAGE_SIZE)

  /** The one thing a shopper most likely wants to do next with this order. */
  const primaryAction = (order: StorefrontOrder) => {
    const state = getOrderState(order)
    const detailHref = `/account/orders/${order.id}`

    if (needsPayment(order)) {
      return (
        <Button size='small' variant='contained' onClick={() => setPayOrder(order)}>
          {t('actions.payNow')}
        </Button>
      )
    }

    if (state === 'shipped' && trackingNumbers(order).length > 0) {
      return (
        <Button size='small' variant='outlined' component={Link} href={`${detailHref}#tracking`}>
          {t('actions.track')}
        </Button>
      )
    }

    if (state === 'ready_for_pickup') {
      return (
        <Button size='small' variant='outlined' component={Link} href={`${detailHref}#pickup`}>
          {t('actions.pickupCode')}
        </Button>
      )
    }

    if (canReturn(order)) {
      return (
        <Button size='small' variant='outlined' component={Link} href={`/account/returns?order=${order.id}`}>
          {t('actions.requestReturn')}
        </Button>
      )
    }

    return (
      <Button size='small' variant='text' component={Link} href={detailHref}>
        {t('actions.view')}
      </Button>
    )
  }

  const closeMenu = () => setMenu(null)

  return (
    <>
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AccountCard>
        {(allCount > 0 || status) && (
          <div className='acc-tabs' role='tablist'>
            <button
              type='button'
              role='tab'
              className='acc-tab'
              aria-selected={!status}
              onClick={() => navigate({ status: '' })}
            >
              {t('orders.all')}
              {allCount > 0 && <span className='acc-count'>{allCount}</span>}
            </button>
            {tabs.map(key => (
              <button
                key={key}
                type='button'
                role='tab'
                className='acc-tab'
                aria-selected={status === key}
                onClick={() => navigate({ status: key })}
              >
                {t(`orderStatus.${key}`)}
                {(counts[key] ?? 0) > 0 && <span className='acc-count'>{counts[key]}</span>}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <AccountLoading />
        ) : orders.length === 0 ? (
          status ? (
            <AccountEmpty
              icon='tabler-filter-off'
              title={t('orders.emptyTab')}
              action={
                <Button size='small' onClick={() => navigate({ status: '' })}>
                  {t('orders.showAll')}
                </Button>
              }
            />
          ) : (
            <AccountEmpty
              icon='tabler-shopping-bag'
              title={t('orders.noOrders')}
              action={
                <Button size='small' variant='contained' component={Link} href='/'>
                  {t('orders.startShopping')}
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className='acc-table-wrap'>
              <table className='acc-table'>
                <thead>
                  <tr>
                    <th>{t('orders.columns.order')}</th>
                    <th>{t('orders.columns.placed')}</th>
                    <th>{t('orders.columns.items')}</th>
                    <th>{t('orders.columns.delivery')}</th>
                    <th className='acc-num'>{t('orders.columns.total')}</th>
                    <th>{t('orders.columns.status')}</th>
                    <th className='acc-num'>{t('orders.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const state = getOrderState(order)
                    const items = order.items ?? []
                    const first = items[0]

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link href={`/account/orders/${order.id}`} className='acc-table-link'>
                            {order.order_number || `#${order.id}`}
                          </Link>
                        </td>
                        <td>{formatDay(order.timestamps?.created_at)}</td>
                        <td>
                          <div className='acc-items'>
                            <span className='acc-thumb'>
                              {first?.image_url ? (
                                <img src={getMediaUrl(first.image_url)} alt='' />
                              ) : (
                                <Icon icon='tabler-photo' />
                              )}
                            </span>
                            <span className='acc-clip'>{first?.product_name || t('orders.unknownProduct')}</span>
                            {items.length > 1 && (
                              <span className='acc-sub'>{t('common.more', { count: items.length - 1 })}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {isPickupOrder(order) ? t('orders.pickup') : order.freight_service?.name || t('orders.shipping')}
                        </td>
                        <td className='acc-num'>{money(order.amounts?.total)}</td>
                        <td>
                          <StatusBadge label={t(`orderState.${state}`)} color={ORDER_STATE_TONE[state]} />
                        </td>
                        <td>
                          <div className='acc-actions'>
                            {primaryAction(order)}
                            <IconButton
                              size='small'
                              aria-label={t('actions.moreActions')}
                              onClick={event => setMenu({ anchor: event.currentTarget, order })}
                            >
                              <Icon icon='tabler-dots-vertical' />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className='acc-card-foot'>
              <span className='acc-sub'>{t('orders.showing', { from, to, total })}</span>
              {pages > 1 && (
                <div className='acc-pager'>
                  <button
                    type='button'
                    className='acc-pg'
                    disabled={page <= 1}
                    aria-label={t('orders.previousPage')}
                    onClick={() => navigate({ page: page - 1 })}
                  >
                    <Icon icon='tabler-chevron-left' />
                  </button>
                  {pageWindow(page, pages).map(number => (
                    <button
                      key={number}
                      type='button'
                      className='acc-pg'
                      aria-current={number === page ? 'page' : undefined}
                      onClick={() => navigate({ page: number })}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type='button'
                    className='acc-pg'
                    disabled={page >= pages}
                    aria-label={t('orders.nextPage')}
                    onClick={() => navigate({ page: page + 1 })}
                  >
                    <Icon icon='tabler-chevron-right' />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </AccountCard>

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menu && [
          <MenuItem key='view' component={Link} href={`/account/orders/${menu.order.id}`} onClick={closeMenu}>
            {t('actions.viewDetails')}
          </MenuItem>,
          canReturn(menu.order) && (
            <MenuItem key='return' component={Link} href={`/account/returns?order=${menu.order.id}`} onClick={closeMenu}>
              {t('actions.requestReturn')}
            </MenuItem>
          ),
          <MenuItem
            key='help'
            component={Link}
            href={`/account/support?order=${encodeURIComponent(menu.order.order_number || String(menu.order.id))}`}
            onClick={closeMenu}
          >
            {t('actions.getHelp')}
          </MenuItem>,
          canCancel(menu.order) && (
            <MenuItem
              key='cancel'
              sx={{ color: 'error.main' }}
              onClick={() => {
                setCancelReason('')
                setCancelTarget(menu.order)
                closeMenu()
              }}
            >
              {t('actions.cancelOrder')}
            </MenuItem>
          )
        ]}
      </Menu>

      {payOrder && (
        <PayOrderDialog
          open
          order={payOrder}
          onClose={() => setPayOrder(null)}
          onPaymentSuccess={() => {
            setPayOrder(null)
            refreshAfterChange()
          }}
        />
      )}

      <Dialog open={Boolean(cancelTarget)} onClose={() => !cancelling && setCancelTarget(null)} maxWidth='sm' fullWidth>
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
          <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>
            {t('orders.keepOrder')}
          </Button>
          <Button variant='contained' color='error' onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t('orders.cancelling') : t('orders.cancelOrder')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Orders
