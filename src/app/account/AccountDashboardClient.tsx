'use client'

// Next Imports
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import { usePageSections } from '@/extensions/hooks/usePageSections'

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
    titleKey: 'settings.title',
    descriptionKey: 'settings.description',
    icon: 'tabler-settings',
    href: '/account/settings'
  }
]

export default function AccountDashboardClient() {
  const router = useRouter()
  const t = useTranslations('account')
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { beforeSections, afterSections } = usePageSections('account/dashboard')

  const handleCardClick = (href: string) => {
    router.push(href)
  }

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
