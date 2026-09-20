'use client'

// React Imports
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Component Imports
import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import PayOrderDialog from '@/components/payments/PayOrderDialog'
import {
  AccountCard,
  AccountEmpty,
  AccountLoading,
  AccountPageHeader,
  formatDay,
  formatShortDay,
  useMoney
} from '@/components/account/AccountUI'

// Utils Imports
import { useAccount } from '@/contexts/AccountContext'
import { usePageSlots } from '@/extensions/hooks/usePageSections'
import { formatCurrency } from '@/utils/format'
import { getMediaUrl } from '@/utils/media'
import { meApi } from '@/utils/meApi'
import { listOf } from '@/views/account/shared/api'
import {
  ORDER_STATE_TONE,
  addressLines,
  getOrderState,
  needsPayment,
  trackingNumbers,
  type StorefrontAddress,
  type StorefrontOrder
} from '@/views/account/shared/orders'
import {
  RETURN_STATE_TONE,
  isActiveReturn,
  returnUnits,
  type CustomerReturn
} from '@/views/account/shared/returns'

type Tone = 'ok' | 'warn' | 'err' | 'info' | 'neu'

type AttentionItem = {
  key: string
  tone: Tone
  icon: string
  title: string
  detail: string
  badge: ReactNode
  action: ReactNode
}

const QUICK_ACTIONS = [
  { key: 'track', href: '/account/orders?status=shipped', icon: 'tabler-truck-delivery' },
  { key: 'return', href: '/account/returns', icon: 'tabler-arrow-back-up' },
  { key: 'invoices', href: '/account/payments', icon: 'tabler-file-invoice' },
  { key: 'help', href: '/account/support', icon: 'tabler-message-circle' }
] as const

/** At most this many rows in "Needs your attention"; the order list has the rest. */
const ATTENTION_LIMIT = 5

export default function AccountDashboardClient() {
  const t = useTranslations('account')
  const money = useMoney()
  const isBelowMd = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const { user, stats, refreshStats } = useAccount()
  const { beforeSlots, afterSlots, replacements } = usePageSlots('account/dashboard')

  const [orders, setOrders] = useState<StorefrontOrder[] | null>(null)
  const [returns, setReturns] = useState<CustomerReturn[]>([])
  const [address, setAddress] = useState<StorefrontAddress | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [payOrder, setPayOrder] = useState<StorefrontOrder | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setOrders(listOf<StorefrontOrder>(await meApi.getOrders({ page: 1, page_size: 20 })))
    } catch (err) {
      setOrders([])
      setError(err instanceof Error ? err.message : t('common.loadFailed'))
    }
  }, [t])

  useEffect(() => {
    loadOrders()
    meApi
      .getReturns({ page_size: 20 })
      .then(response => setReturns(listOf<CustomerReturn>(response)))
      .catch(() => setReturns([]))
    meApi
      .getDefaultAddress()
      .then(response => setAddress(response?.id ? response : null))
      .catch(() => setAddress(null))
  }, [loadOrders])

  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []

    for (const order of orders ?? []) {
      const number = order.order_number || `#${order.id}`
      const state = getOrderState(order)
      const badge = <StatusBadge label={t(`orderState.${state}`)} color={ORDER_STATE_TONE[state]} />
      const detailHref = `/account/orders/${order.id}`

      if (needsPayment(order)) {
        items.push({
          key: `pay-${order.id}`,
          tone: state === 'payment_failed' ? 'err' : 'warn',
          icon: 'tabler-credit-card',
          title: t('dashboard.attention.pay', { number }),
          detail: [
            t('dashboard.attention.placed', { date: formatDay(order.timestamps?.created_at) }),
            t('common.products', { count: order.items?.length ?? 0 }),
            money(order.amounts?.total)
          ].join(' · '),
          badge,
          action: (
            <Button size='small' variant='contained' onClick={() => setPayOrder(order)}>
              {t('actions.payNow')}
            </Button>
          )
        })
      } else if (state === 'shipped') {
        const tracking = trackingNumbers(order)[0]

        items.push({
          key: `shipped-${order.id}`,
          tone: 'info',
          icon: 'tabler-truck-delivery',
          title: t('dashboard.attention.shipped', { number }),
          detail: tracking
            ? [tracking.carrier_name, tracking.tracking_number].filter(Boolean).join(' · ')
            : t('dashboard.attention.shippedOn', { date: formatDay(order.timestamps?.shipped_at) }),
          badge,
          action: (
            <Button size='small' variant='outlined' component={Link} href={`${detailHref}#tracking`}>
              {tracking ? t('actions.track') : t('actions.view')}
            </Button>
          )
        })
      } else if (state === 'ready_for_pickup') {
        items.push({
          key: `pickup-${order.id}`,
          tone: 'info',
          icon: 'tabler-building-store',
          title: t('dashboard.attention.pickup', { number }),
          detail: order.pickup_point?.name
            ? t('dashboard.attention.collectFrom', { place: order.pickup_point.name })
            : t('dashboard.attention.placed', { date: formatDay(order.timestamps?.created_at) }),
          badge,
          action: (
            <Button size='small' variant='outlined' component={Link} href={`${detailHref}#pickup`}>
              {t('actions.pickupCode')}
            </Button>
          )
        })
      }
    }

    for (const request of returns.filter(isActiveReturn)) {
      items.push({
        key: `return-${request.id}`,
        tone: request.status === 'open' ? 'warn' : 'info',
        icon: 'tabler-receipt-refund',
        title: t('dashboard.attention.return', { number: request.order_number || request.return_number }),
        detail: t('dashboard.attention.returnDetail', { count: returnUnits(request), number: request.return_number }),
        badge: <StatusBadge label={t(`returnState.${request.status}`)} color={RETURN_STATE_TONE[request.status]} />,
        action: (
          <Button size='small' variant='outlined' component={Link} href='/account/returns'>
            {t('actions.viewReturn')}
          </Button>
        )
      })
    }

    return items.slice(0, ATTENTION_LIMIT)
  }, [orders, returns, money, t])

  /** A plugin may replace a dashboard block outright. */
  const slot = (slotId: string, fallback: ReactNode) => {
    const ext = replacements.get(slotId)
    const Component = ext?.component

    return Component ? <Component key={ext.id} /> : fallback
  }

  const firstName = user?.first_name?.trim()
  const recent = (orders ?? []).slice(0, 5)
  const unread = stats?.unread_messages_count ?? 0
  const showWallet = stats != null && stats.wallet_balance != null
  const StatsTail = replacements.get('StatsRowTail')?.component

  return (
    <div className='acc-page'>
      {beforeSlots.map(ext => ext.component && <ext.component key={ext.id} />)}

      {slot(
        'Welcome',
        <AccountPageHeader
          title={firstName ? t('dashboard.welcome', { name: firstName }) : t('dashboard.welcomeNoName')}
          subtitle={t('dashboard.subtitle')}
        />
      )}

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className='acc-grid'>
        <div className='acc-col'>
          <AccountCard
            title={t('dashboard.attention.title')}
            action={
              orders !== null && attention.length > 0 ? (
                <span className='acc-sub'>{t('dashboard.attention.count', { count: attention.length })}</span>
              ) : undefined
            }
          >
            {orders === null ? (
              <AccountLoading />
            ) : attention.length === 0 ? (
              <div className='acc-row'>
                <span className='acc-ico acc-ico--ok'>
                  <Icon icon='tabler-circle-check' />
                </span>
                <div className='acc-grow'>
                  <div className='acc-strong'>{t('dashboard.attention.empty')}</div>
                  <div className='acc-sub'>{t('dashboard.attention.emptyHint')}</div>
                </div>
              </div>
            ) : (
              attention.map(item => (
                <div key={item.key} className='acc-row acc-row--stack'>
                  <span className={`acc-ico acc-ico--${item.tone}`}>
                    <Icon icon={item.icon} />
                  </span>
                  <div className='acc-grow'>
                    <div className='acc-strong acc-truncate'>{item.title}</div>
                    <div className='acc-sub acc-truncate'>{item.detail}</div>
                  </div>
                  <span className='acc-hide-sm'>{item.badge}</span>
                  <div className='acc-row-action'>{item.action}</div>
                </div>
              ))
            )}
          </AccountCard>

          {slot(
            'RecentOrders',
            <AccountCard
              title={t('dashboard.recentOrders')}
              action={
                <Link href='/account/orders' className='acc-link'>
                  {t('dashboard.viewAll')}
                  <Icon icon='tabler-chevron-right' />
                </Link>
              }
            >
              {orders === null ? (
                <AccountLoading />
              ) : recent.length === 0 ? (
                <AccountEmpty
                  icon='tabler-shopping-bag'
                  title={t('dashboard.noOrders')}
                  action={
                    <Button size='small' variant='contained' component={Link} href='/'>
                      {t('dashboard.startShopping')}
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className='acc-table-wrap acc-hide-sm'>
                    <table className='acc-table'>
                      <thead>
                        <tr>
                          <th>{t('dashboard.columns.order')}</th>
                          <th>{t('dashboard.columns.placed')}</th>
                          <th>{t('dashboard.columns.items')}</th>
                          <th className='acc-num'>{t('dashboard.columns.total')}</th>
                          <th>{t('dashboard.columns.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map(order => {
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
                                  <span className='acc-clip acc-clip--sm'>
                                    {first?.product_name || t('orders.unknownProduct')}
                                  </span>
                                  {items.length > 1 && (
                                    <span className='acc-sub'>{t('common.more', { count: items.length - 1 })}</span>
                                  )}
                                </div>
                              </td>
                              <td className='acc-num'>{money(order.amounts?.total)}</td>
                              <td>
                                <StatusBadge label={t(`orderState.${state}`)} color={ORDER_STATE_TONE[state]} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className='acc-show-sm'>
                    {recent.map(order => {
                      const state = getOrderState(order)

                      return (
                        <Link key={order.id} href={`/account/orders/${order.id}`} className='acc-row'>
                          <div className='acc-grow'>
                            <div className='acc-strong'>{order.order_number || `#${order.id}`}</div>
                            <div className='acc-sub'>
                              {formatShortDay(order.timestamps?.created_at)} · {money(order.amounts?.total)}
                            </div>
                          </div>
                          <StatusBadge label={t(`orderState.${state}`)} color={ORDER_STATE_TONE[state]} />
                          <Icon icon='tabler-chevron-right' className='acc-chev' />
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </AccountCard>
          )}
        </div>

        <div className='acc-col'>
          {user?.staff_member?.is_active && (
            <Link href={isBelowMd ? '/admin/m' : '/admin'} className='acc-tile acc-staff-shortcut'>
              <Icon icon='tabler-shield-check' className='acc-tile-icon' />
              <div className='acc-tile-title'>{t('dashboard.adminShortcut.title')}</div>
              <div className='acc-tile-desc'>{t('dashboard.adminShortcut.description')}</div>
            </Link>
          )}

          <div className='acc-kpis'>
            {showWallet && (
              <div className='acc-kpi'>
                <div className='acc-kpi-head'>
                  <Icon icon='tabler-wallet' />
                  {t('dashboard.kpi.wallet')}
                </div>
                <div className='acc-kpi-value'>
                  {stats.wallet_currency
                    ? formatCurrency(stats.wallet_balance ?? 0, stats.wallet_currency)
                    : money(stats.wallet_balance)}
                </div>
                <Link href='/account/wallet/withdraw' className='acc-link acc-link--sm'>
                  {t('dashboard.kpi.withdraw')}
                </Link>
              </div>
            )}
            <div className='acc-kpi'>
              <div className='acc-kpi-head'>
                <Icon icon='tabler-mail' />
                {t('dashboard.kpi.messages')}
              </div>
              <div className='acc-kpi-value'>{unread}</div>
              <Link href='/account/alerts' className='acc-link acc-link--sm'>
                {t('dashboard.kpi.openInbox')}
              </Link>
            </div>
            {StatsTail && <StatsTail />}
          </div>

          {slot(
            'QuickLinks',
            <AccountCard title={t('dashboard.quickActions.title')}>
              <div className='acc-card-body'>
                <div className='acc-tiles'>
                  {QUICK_ACTIONS.map(action => (
                    <Link key={action.key} href={action.href} className='acc-tile'>
                      <Icon icon={action.icon} className='acc-tile-icon' />
                      <div className='acc-tile-title'>{t(`dashboard.quickActions.${action.key}`)}</div>
                      <div className='acc-tile-desc acc-hide-sm'>{t(`dashboard.quickActions.${action.key}Hint`)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </AccountCard>
          )}

          <AccountCard
            title={t('dashboard.defaultAddress.title')}
            action={
              <Link href='/account/addresses' className='acc-link'>
                {t('dashboard.defaultAddress.manage')}
              </Link>
            }
          >
            <div className='acc-card-body'>
              {address === undefined ? (
                <AccountLoading />
              ) : address ? (
                <div className='acc-text'>
                  {address.full_name && <div className='acc-strong'>{address.full_name}</div>}
                  {addressLines(address).map(line => (
                    <div key={line}>{line}</div>
                  ))}
                  {address.phone && <div className='acc-sub mbs-1.5'>{address.phone}</div>}
                </div>
              ) : (
                <div className='acc-sub'>{t('dashboard.defaultAddress.empty')}</div>
              )}
            </div>
          </AccountCard>
        </div>
      </div>

      {afterSlots.map(ext => ext.component && <ext.component key={ext.id} />)}

      {payOrder && (
        <PayOrderDialog
          open
          order={payOrder}
          onClose={() => setPayOrder(null)}
          onPaymentSuccess={() => {
            setPayOrder(null)
            loadOrders()
            refreshStats()
          }}
        />
      )}
    </div>
  )
}
