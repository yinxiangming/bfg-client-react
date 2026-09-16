'use client'

import { useLocale, useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import { extensionDescription, extensionName, type ConsoleExtension } from '@/services/console'

type Props = {
  extension: ConsoleExtension
  /** Someone who may switch this workspace's extensions; an owner of a closed one may not. */
  canChange: boolean
  /** A change to this extension is in flight. */
  busy: boolean
  /** Some extension's change is in flight, so no other may start. */
  anyBusy: boolean
  onActivate: () => void
  onDeactivate: () => void
  /** Opens the extension's own page in that workspace's admin; absent when it has none. */
  onSettings?: () => void
}

/** The date an extension was switched on, in the reader's language. */
function activatedOn(value: string | null, locale: string): string | null {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export default function ExtensionCard({
  extension,
  canChange,
  busy,
  anyBusy,
  onActivate,
  onDeactivate,
  onSettings
}: Props) {
  const t = useTranslations('admin.console.extensions')
  const locale = useLocale()
  const on = extension.status === 'active'
  const blocked = extension.unmet_prerequisites.length > 0
  const activated = activatedOn(extension.activated_at, locale)

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
            <StatusBadge label={on ? t('on') : t('off')} color={on ? 'success' : 'default'} />
          </Box>
          <Typography variant='body2' sx={{ color: 'var(--at-row-sub)', textWrap: 'pretty' }}>
            {extensionDescription(extension, locale)}
          </Typography>
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
            <Typography variant='caption' sx={{ color: 'var(--at-warn-fg, inherit)' }}>
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
          {on ? (activated ? t('activatedAt', { date: activated }) : t('on')) : t('offHint')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {busy && <CircularProgress size={16} />}
          {on ? (
            <>
              {onSettings && (
                <Button size='small' startIcon={<Icon icon='tabler-adjustments' />} onClick={onSettings}>
                  {t('settings')}
                </Button>
              )}
              <Button size='small' variant='outlined' disabled={!canChange || anyBusy} onClick={onDeactivate}>
                {t('deactivate')}
              </Button>
            </>
          ) : (
            <Button
              size='small'
              variant='contained'
              disabled={!canChange || anyBusy || blocked}
              onClick={onActivate}
            >
              {t('activate')}
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  )
}
