'use client'

/**
 * What one workspace has metered in a month, and what it has left.
 *
 * Usage is counted in points against a monthly cap; when an invoice goes past due the
 * platform pauses the metered features, which is the one thing on this page a reader has
 * to act on, so it is said at the top rather than left to be inferred from the figures.
 *
 * The month lives in the URL, so a reader can send someone a link to the month they are
 * looking at, and coming back from an invoice lands on the month it bills for. The
 * workspace's name comes from the console's own list rather than from a second request:
 * this page needs no more of the workspace than the figures the usage endpoint carries.
 */

import { useMemo } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatusBadge from '@/components/schema/StatusBadge'
import { useConsoleWorkspace } from '@/contexts/ConsoleContext'
import { formatMoney } from '@/services/console'
import { formatPoints, getIntlLocale } from '@/utils/format'

import { currentMonth, formatDay, formatPeriod, MONTH_PATTERN, recentMonths } from './billingPeriods'
import SectionCard from './SectionCard'
import { useConsoleWorkspaceDetail } from './useConsoleWorkspaceDetail'
import { useConsoleWorkspaceUsage } from './useConsoleWorkspaceUsage'
import { usePlatformAdmin } from './usePlatformAdmin'
import WorkspaceUsageCapCard from './WorkspaceUsageCapCard'

/** How far back the month picker goes. A year is as much as the platform bills for. */
const MONTHS_OFFERED = 12

/**
 * A metered quantity, which arrives with four decimal places.
 *
 * Unlike points these are usually whole things — four hundred lookups, not 400.0000 of
 * them — so the places are dropped when there is nothing in them and kept when there is.
 */
function formatQuantity(value: string, locale: string): string {
  const quantity = parseFloat(value)

  if (isNaN(quantity)) return value

  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(quantity)
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='caption' sx={{ display: 'block', color: 'var(--at-row-sub)' }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: strong ? 24 : 18, fontWeight: strong ? 600 : 500, color: 'var(--at-row-fg)' }}>{value}</Box>
    </Box>
  )
}

export default function WorkspaceUsagePage({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.usage')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const membership = useConsoleWorkspace(workspaceId)
  const { isPlatformAdmin } = usePlatformAdmin()

  const requested = searchParams.get('month') ?? ''
  const month = MONTH_PATTERN.test(requested) ? requested : currentMonth()
  const { state: detailState } = useConsoleWorkspaceDetail(workspaceId)
  const usageAvailable = detailState.kind === 'loaded' && detailState.workspace.capabilities?.usage === true
  const { state, reload } = useConsoleWorkspaceUsage(workspaceId, month, usageAvailable)

  // A month reached by link may be older than the picker offers; it still belongs in the
  // list, or the control would show nothing while the page shows that month's figures.
  const months = useMemo(() => {
    const offered = recentMonths(MONTHS_OFFERED)

    return offered.includes(month) ? offered : [...offered, month].sort().reverse()
  }, [month])

  const pickMonth = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (next === currentMonth()) params.delete('month')
    else params.set('month', next)

    const query = params.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const usage = state.kind === 'loaded' ? state.usage : null

  // Only the width of the bar: both figures are shown in full beside it, and a cap of
  // zero or a missing one would otherwise divide the bar by nothing.
  const cap = Number(usage?.cap_points)
  const used = Number(usage?.used_points)
  const spent = usage && cap > 0 && !isNaN(used) ? Math.min(100, Math.max(0, (used / cap) * 100)) : null

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', whiteSpace: 'nowrap' as const }
  const mutedSx = { color: 'var(--at-row-sub)' }
  const emptySx = { px: 4, py: 6, textAlign: 'center' as const, fontSize: 13, ...mutedSx }

  if (detailState.kind === 'loading') {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (detailState.kind === 'failed') {
    return <Alert severity='error'>{detailState.notFound ? t('notFound') : t('loadFailed')}</Alert>
  }

  if (!usageAvailable) {
    return (
      <>
        <AdminPageHeader title={t('title')} subtitle={t('subtitle')} />
        <Alert severity='info'>{t('unavailable')}</Alert>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={membership ? `${membership.name} · ${t('subtitle')}` : t('subtitle')}
        actions={
          <TextField
            select
            size='small'
            label={t('month')}
            value={month}
            onChange={event => pickMonth(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            {months.map(option => (
              <MenuItem key={option} value={option}>
                {formatPeriod(option, locale)}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {state.kind === 'loading' && (
        <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={28} aria-label={t('loading')} />
        </Card>
      )}

      {state.kind === 'failed' && (
        <Alert
          severity='error'
          action={
            !state.notFound && (
              <Button color='inherit' size='small' onClick={() => void reload()}>
                {tActions('retry')}
              </Button>
            )
          }
        >
          {state.notFound ? t('notFound') : t('loadFailed')}
        </Alert>
      )}

      {usage && (
        <Box sx={{ display: 'grid', gap: 6, alignItems: 'start' }}>
          {usage.overdue && (
            <Alert severity='error'>
              <AlertTitle>{t('overdue.title')}</AlertTitle>
              {t('overdue.body')}
            </Alert>
          )}

          <SectionCard title={formatPeriod(usage.month, locale)}>
            <Box sx={{ px: 4, py: 4, display: 'grid', gap: 4 }}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 4,
                  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }
                }}
              >
                <Figure strong label={t('used')} value={t('points', { points: formatPoints(usage.used_points, locale) })} />
                <Figure label={t('cap')} value={t('points', { points: formatPoints(usage.cap_points, locale) })} />
                <Figure
                  label={t('remaining')}
                  value={t('points', { points: formatPoints(usage.remaining_points, locale) })}
                />
              </Box>

              {spent !== null && (
                <LinearProgress
                  variant='determinate'
                  value={spent}
                  color={usage.overdue ? 'error' : 'primary'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              )}

              <Typography variant='body2' sx={mutedSx}>
                {usage.estimated_amount === null
                  ? t('noEstimate')
                  : t('estimated', { amount: formatMoney(usage.estimated_amount, usage.currency) })}
              </Typography>
            </Box>
          </SectionCard>

          {isPlatformAdmin && <WorkspaceUsageCapCard workspaceId={workspaceId} onChanged={() => void reload()} />}

          <SectionCard title={t('byMeter')}>
            {usage.meters.length === 0 ? (
              <Box sx={emptySx}>{t('empty')}</Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('columns.meter')}</TableCell>
                      <TableCell align='right'>{t('columns.quantity')}</TableCell>
                      <TableCell align='right'>{t('columns.points')}</TableCell>
                      <TableCell align='right'>{t('columns.amount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usage.meters.map(meter => (
                      <TableRow key={meter.meter} hover>
                        <TableCell sx={cellSx}>{meter.meter}</TableCell>
                        <TableCell align='right' sx={cellSx}>
                          {formatQuantity(meter.quantity, locale)}
                        </TableCell>
                        <TableCell align='right' sx={cellSx}>
                          {formatPoints(meter.points, locale)}
                        </TableCell>
                        <TableCell align='right' sx={cellSx}>
                          {meter.amount === null ? (
                            <Box component='span' sx={mutedSx}>
                              —
                            </Box>
                          ) : (
                            formatMoney(meter.amount, usage.currency)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </SectionCard>

          <SectionCard title={t('byDay')}>
            {usage.days.length === 0 ? (
              <Box sx={emptySx}>{t('empty')}</Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('columns.day')}</TableCell>
                      <TableCell align='right'>{t('columns.points')}</TableCell>
                      <TableCell>{t('columns.meters')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usage.days.map(day => (
                      <TableRow key={day.day} hover>
                        <TableCell sx={cellSx}>{formatDay(day.day, locale)}</TableCell>
                        <TableCell align='right' sx={cellSx}>
                          {formatPoints(day.points, locale)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, whiteSpace: 'normal' }}>
                          {day.meters.length === 0 ? (
                            <Box component='span' sx={mutedSx}>
                              —
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {day.meters.map(meter => (
                                <StatusBadge
                                  key={meter.meter}
                                  noDot
                                  label={`${meter.meter} · ${formatQuantity(meter.quantity, locale)}`}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </SectionCard>
        </Box>
      )}
    </>
  )
}
