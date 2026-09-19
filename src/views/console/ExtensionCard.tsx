'use client'

import { useLocale, useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import {
  extensionDescription,
  extensionName,
  formatMoney,
  type ConsoleExtension,
  type ConsoleExtensionPrice
} from '@/services/console'

type Props = {
  extension: ConsoleExtension
  /** Someone who may switch this workspace's extensions; an owner of a closed one may not. */
  canChange: boolean
  /** A change to this extension is in flight. */
  busy: boolean
  /** Some extension's change is in flight, so no other may start. */
  anyBusy: boolean
  /** An add-on this workspace has yet to acquire: it is asked for rather than switched on. */
  needsAcquire: boolean
  onAcquire: () => void
  onActivate: () => void
  onDeactivate: () => void
  /** Opens the extension's own page in that workspace's admin; absent when it has none. */
  onSettings?: () => void
}

/** An extension that comes with the base plan rather than being sold on top of it. */
const PRICING_BASE = 'base'

/** The date an extension was switched on, in the reader's language. */
function activatedOn(value: string | null, locale: string): string | null {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

/**
 * What one period costs, in the workspace's own currency where the platform could
 * convert it, and in the platform's own where it could not — a price in the wrong
 * currency is a better answer than a card that says nothing about what it costs.
 */
function priceAmount(price: ConsoleExtensionPrice): string {
  return price.workspace_amount === null
    ? formatMoney(price.amount, price.currency)
    : formatMoney(price.workspace_amount, price.workspace_currency)
}

export default function ExtensionCard({
  extension,
  canChange,
  busy,
  anyBusy,
  needsAcquire,
  onAcquire,
  onActivate,
  onDeactivate,
  onSettings
}: Props) {
  const t = useTranslations('admin.console.extensions')
  const locale = useLocale()
  const blocked = extension.unmet_prerequisites.length > 0
  const activated = activatedOn(extension.activated_at, locale)
  const price = extension.price ?? null

  // What it costs, per period. An extension that comes with the base plan says so; one
  // the platform has not priced says nothing at all, because "no price" is a gap in the
  // platform's own setup and not an offer to make to whoever is reading.
  const cost = (() => {
    if (extension.pricing === PRICING_BASE) {
      return { headline: t('price.included'), listed: null, trial: null }
    }
    if (!price) return null

    // An add-on the platform gives away says so in words. "0.00 a month" is the same
    // fact written as a charge, and reads as one.
    if (Number(price.amount) === 0) return { headline: t('price.free'), listed: null, trial: null }

    const unit = t.has(`price.unit.${price.interval}`) ? t(`price.unit.${price.interval}`) : price.interval

    return {
      headline:
        price.interval_count > 1
          ? t('price.perMany', { amount: priceAmount(price), count: price.interval_count, unit })
          : t('price.per', { amount: priceAmount(price), unit }),
      // Only where the two differ: repeating the same number in the same currency
      // reads as two prices.
      listed:
        price.workspace_amount !== null && price.workspace_currency !== price.currency
          ? t('price.listed', { amount: formatMoney(price.amount, price.currency) })
          : null,
      trial: price.trial_days > 0 ? t('price.trial', { days: price.trial_days }) : null
    }
  })()

  // `status` is the switch; `available` is whether it is actually running for the
  // workspace. They part company when something the extension needs falls away, and an
  // extension that is on but not live must not read as working.
  const presentation = (() => {
    switch (extension.status) {
      case 'active':
        return extension.available
          ? { label: t('on'), color: 'success' as const, meta: activated ? t('activatedAt', { date: activated }) : t('on') }
          : { label: t('notLive'), color: 'warning' as const, meta: t('notLiveHint') }
      case 'paused':
        return { label: t('paused'), color: 'warning' as const, meta: t('pausedHint') }
      case 'archiving':
      case 'restoring':
        return { label: t('working'), color: 'default' as const, meta: t('workingHint') }
      case 'archived':
        return { label: t('archived'), color: 'default' as const, meta: t('archivedHint') }
      default:
        return { label: t('off'), color: 'default' as const, meta: t('offHint') }
    }
  })()

  const canActivate = canChange && extension.status === 'inactive' && !blocked
  const canDeactivate = canChange && (extension.status === 'active' || extension.status === 'paused')
  const switchedOn = extension.status === 'active' || extension.status === 'paused'

  // Acquiring replaces the switch for an add-on the workspace is not entitled to: one it
  // has never had, and one paused when its entitlement ran out, which is got again rather
  // than switched off. An archived one, or one mid-archive, keeps its own controls: the
  // server refuses a change either way until that has finished.
  const acquirable = needsAcquire && (extension.status === 'inactive' || extension.status === 'paused')

  // A free add-on is switched on the moment it is acquired, so whatever blocks switching
  // one on blocks getting it.
  const canAcquire = canChange && !blocked

  // Neither "Switch it on to start using it" nor "Paused when its entitlement ended" is
  // what to do about an add-on the workspace does not hold.
  const meta = acquirable
    ? t(extension.status === 'paused' ? 'acquireAgainHint' : 'acquireHint')
    : presentation.meta

  return (
    <Card component='section' sx={{ display: 'flex', flexDirection: 'column', p: 4, gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            backgroundColor: 'var(--at-accent-soft)',
            color: 'var(--at-accent-soft-fg)'
          }}
        >
          <Icon icon={extension.icon || 'tabler-puzzle'} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography
              component='h2'
              sx={{
                minWidth: 0,
                fontFamily: 'var(--at-font-display)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--at-row-fg)'
              }}
            >
              {extensionName(extension, locale)}
            </Typography>
            <StatusBadge label={presentation.label} color={presentation.color} />
          </Box>
          <Typography variant='body2' sx={{ color: 'var(--at-row-sub)', textWrap: 'pretty' }}>
            {extensionDescription(extension, locale)}
          </Typography>
          {cost && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 2 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--at-row-fg)'
                }}
              >
                {cost.headline}
              </Typography>
              {cost.listed && (
                <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
                  {cost.listed}
                </Typography>
              )}
              {cost.trial && <StatusBadge noDot label={cost.trial} color='info' />}
            </Box>
          )}
          {extension.surfaces.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
                {t('appliesTo')}
              </Typography>
              {extension.surfaces.map(surface => (
                <StatusBadge
                  key={surface}
                  noDot
                  label={t.has(`surfaces.${surface}`) ? t(`surfaces.${surface}`) : surface}
                />
              ))}
            </Box>
          )}
          {blocked && (
            <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
              {t('prerequisites')} {extension.unmet_prerequisites.join('; ')}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 'auto',
          pt: 3,
          borderTop: '1px solid var(--at-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3
        }}
      >
        <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
          {meta}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {busy && <CircularProgress size={16} />}
          {acquirable ? (
            <Button size='small' variant='contained' disabled={!canAcquire || anyBusy} onClick={onAcquire}>
              {t('acquire')}
            </Button>
          ) : switchedOn ? (
            <>
              {onSettings && extension.status === 'active' && (
                <Button size='small' startIcon={<Icon icon='tabler-adjustments' />} onClick={onSettings}>
                  {t('settings')}
                </Button>
              )}
              <Button size='small' variant='outlined' disabled={!canDeactivate || anyBusy} onClick={onDeactivate}>
                {t('deactivate')}
              </Button>
            </>
          ) : (
            <Button size='small' variant='contained' disabled={!canActivate || anyBusy} onClick={onActivate}>
              {t('activate')}
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  )
}
