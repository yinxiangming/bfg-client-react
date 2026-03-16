'use client'

// Next Imports
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import { Icon } from '@iconify/react'
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { meApi } from '@/utils/meApi'

interface AccountMenuItem {
  titleKey: string
  descriptionKey: string
  icon: string
  href: string
}

// Account menu items - shortcuts for the dashboard
const menuItemsConfig: AccountMenuItem[] = [
  {
    titleKey: 'orders.title',
    descriptionKey: 'orders.description',
    icon: 'tabler-shopping-cart',
    href: '/account/orders'
  },
  {
    titleKey: 'profile.title',
    descriptionKey: 'profile.description',
    icon: 'tabler-user',
    href: '/account/settings'
  },
  {
    titleKey: 'addresses.title',
    descriptionKey: 'addresses.description',
    icon: 'tabler-map-pin',
    href: '/account/addresses'
  },
  {
    titleKey: 'payments.title',
    descriptionKey: 'payments.description',
    icon: 'tabler-credit-card',
    href: '/account/payments'
  },
  {
    titleKey: 'inbox.title',
    descriptionKey: 'inbox.description',
    icon: 'tabler-mail',
    href: '/account/alerts'
  },
  {
    titleKey: 'support.title',
    descriptionKey: 'support.description',
    icon: 'tabler-headset',
    href: '/account/support'
  },
  {
    titleKey: 'settings.title',
    descriptionKey: 'settings.description',
    icon: 'tabler-settings',
    href: '/account/settings'
  }
]

interface DashboardStats {
  wallet_balance: number | null
  wallet_currency: string | null
  order_counts: Record<string, number>
  unread_messages_count: number
  /** Plugin-provided stats (e.g. extensions inject their own keys here) */
  pluginStats?: Record<string, unknown>
}

export default function AccountDashboardClient() {
  const router = useRouter()
  const t = useTranslations('account')
  const storefrontConfig = useStorefrontConfigSafe()
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { beforeSections, afterSections, replacements } = usePageSections('account/dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const displayCurrency = stats?.wallet_currency ?? storefrontConfig.default_currency

  useEffect(() => {
    let cancelled = false
    meApi
      .getDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCardClick = (href: string) => {
    router.push(href)
  }

  const orderStatusKeys = ['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const
  const orderCountTotal = stats
    ? orderStatusKeys.reduce((sum, s) => sum + (stats.order_counts[s] ?? 0), 0)
    : 0

  return (
    <div className='flex flex-col gap-6'>
      {beforeSections.map(
        ext =>
          ext.component && (
            <div key={ext.id}>
              <ext.component />
            </div>
          )
      )}
      <div>
        <Typography variant='h4' className='mbe-2'>
          {t('pages.dashboard.title')}
        </Typography>
        <Typography>{t('pages.dashboard.subtitle')}</Typography>
      </div>

      {/* Stats cards: wallet, orders by status, new messages, then plugin slot StatsRowTail */}
      {statsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : stats ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {displayCurrency && (
            <Card
              variant='outlined'
              sx={{ minWidth: 160, flex: 1, cursor: 'pointer' }}
              onClick={() => handleCardClick('/account/payments')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Icon icon='mdi:wallet-outline' style={{ color: '#6366f1', fontSize: 20 }} />
                  <Typography variant='caption' color='text.secondary'>
                    {t('dashboard.stats.walletBalance')}
                  </Typography>
                </Box>
                <Typography variant='h6' fontWeight={600}>
                  {displayCurrency} {Number(stats.wallet_balance ?? 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
          <Card
            variant='outlined'
            sx={{ minWidth: 160, flex: 1, cursor: 'pointer' }}
            onClick={() => handleCardClick('/account/orders')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Icon icon='mdi:cart-outline' style={{ color: '#22c55e', fontSize: 20 }} />
                <Typography variant='caption' color='text.secondary'>
                  Orders
                </Typography>
              </Box>
              <Typography variant='h6' fontWeight={600}>
                {orderCountTotal}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                {[
                  stats.order_counts.pending ? `${stats.order_counts.pending} ${t('dashboard.stats.ordersPending')}` : null,
                  stats.order_counts.paid ? `${stats.order_counts.paid} ${t('dashboard.stats.ordersPaid')}` : null,
                  stats.order_counts.shipped ? `${stats.order_counts.shipped} ${t('dashboard.stats.ordersShipped')}` : null,
                  stats.order_counts.completed ? `${stats.order_counts.completed} ${t('dashboard.stats.ordersCompleted')}` : null,
                  stats.order_counts.cancelled ? `${stats.order_counts.cancelled} ${t('dashboard.stats.ordersCancelled')}` : null
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Typography>
            </CardContent>
          </Card>
          <Card
            variant='outlined'
            sx={{ minWidth: 160, flex: 1, cursor: 'pointer' }}
            onClick={() => handleCardClick('/account/alerts')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Icon icon='mdi:email-outline' style={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant='caption' color='text.secondary'>
                  {t('dashboard.stats.newMessages')}
                </Typography>
              </Box>
              <Typography variant='h6' fontWeight={600}>
                {stats?.unread_messages_count ?? 0}
              </Typography>
            </CardContent>
          </Card>
          {(() => {
            const ext = replacements.get('StatsRowTail')
            const Component = ext?.component
            return Component ? (
              <Box key={ext!.id} sx={{ minWidth: 160, flex: 1, display: 'flex', alignSelf: 'stretch' }}>
                <Component />
              </Box>
            ) : null
          })()}
        </Box>
      ) : null}

      <Card
        variant='outlined'
        sx={{
          borderRadius: 2,
          boxShadow: 'none',
          border: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <CardContent>
          <Grid container spacing={6}>
            {menuItemsConfig.map((item, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={index}
                className={classnames({
                  '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie':
                    isBelowMdScreen && !isBelowSmScreen && index % 2 === 0 && index < menuItemsConfig.length - 1,
                })}
              >
                <div
                  onClick={() => handleCardClick(item.href)}
                  className={classnames(
                    'flex flex-col items-center gap-4 p-6 cursor-pointer rounded transition-colors',
                    'hover:bg-actionHover active:bg-actionSelected'
                  )}
                >
                  <Avatar variant='rounded' className='is-16 bs-16 bg-actionSelected text-textPrimary'>
                    <i className={classnames(item.icon, 'text-3xl')} />
                  </Avatar>
                  <div className='flex flex-col items-center text-center gap-1'>
                    <Typography className='font-medium text-textPrimary'>
                      {t(`dashboard.menuItems.${item.titleKey}`)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {t(`dashboard.menuItems.${item.descriptionKey}`)}
                    </Typography>
                  </div>
                </div>
                {(isBelowMdScreen && !isBelowSmScreen && index % 2 === 0 && index < menuItemsConfig.length - 2) ||
                  (isBelowSmScreen && index < menuItemsConfig.length - 1) ? (
                  <div className='border-be mbs-4' />
                ) : null}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      {afterSections.map(
        ext =>
          ext.component && (
            <div key={ext.id}>
              <ext.component />
            </div>
          )
      )}
    </div>
  )
}
