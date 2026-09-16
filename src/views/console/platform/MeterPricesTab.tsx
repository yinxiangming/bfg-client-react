'use client'

/**
 * What each meter costs, and what it used to.
 *
 * One block per meter, its prices newest first, with the row a call would be
 * billed at right now marked and the rest shown as the history they are. A
 * meter whose every price starts later has nothing in force — which is what a
 * price entered with the wrong date looks like, and until one starts nothing is
 * billed for that meter at all — so it is called out rather than left to be
 * inferred from a table with no mark in it.
 *
 * There is no way to edit or delete a price here because there is none on the
 * server either: a new rate is a new row, so that a bill already issued can
 * still be explained by the row it was calculated from.
 */

import { useCallback, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import { listMeterPrices, type ConsoleMeterPrices } from '@/services/consoleAdmin'

import { formatMoment } from '../billingPeriods'
import { refusalMessage } from '../refusal'
import { cellSx, mutedSx, PanelBar, PanelBody, PanelEmpty, PanelFailed, PanelSpinner, PanelTable, useLoad } from './panels'
import MeterPriceAddDialog from './MeterPriceAddDialog'

/**
 * The share a price with no margin of its own inherits, read off one that
 * inherits it.
 *
 * The listing already carries it on every such row, so the dialog's hint costs
 * no second request. Null when every price names its own margin, and the hint
 * then says what leaving the field empty does without naming a number.
 */
function inheritedMargin(groups: ConsoleMeterPrices[]): string | null {
  for (const group of groups) {
    const inheriting = group.prices.find(price => price.uses_default_margin)

    if (inheriting) return inheriting.effective_margin
  }

  return null
}

export default function MeterPricesTab() {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const load = useCallback(() => listMeterPrices(), [])
  const { state, reload, replace } = useLoad<ConsoleMeterPrices[]>(load)
  // The meter the dialog opens on, and '' for one opened from the bar; null is closed.
  const [adding, setAdding] = useState<string | null>(null)

  const groups = state.kind === 'loaded' ? state.data : []

  /**
   * Put the answer's meter back in the list, which is why the server answers
   * with the whole meter: a price dated later than now leaves a different row
   * in force, and the block says which.
   */
  const onAdded = (added: ConsoleMeterPrices) => {
    const known = groups.some(group => group.meter === added.meter)

    replace(
      known
        ? groups.map(group => (group.meter === added.meter ? added : group))
        : [...groups, added].sort((left, right) => left.meter.localeCompare(right.meter))
    )
    setAdding(null)
  }

  return (
    <>
      <PanelBar hint={t('prices.hint')}>
        <Button
          size='small'
          variant='contained'
          startIcon={<Icon icon='tabler-plus' />}
          onClick={() => setAdding('')}
        >
          {t('prices.add')}
        </Button>
      </PanelBar>

      {state.kind === 'loading' && <PanelSpinner label={t('prices.loading')} />}

      {state.kind === 'failed' && (
        <PanelFailed
          message={refusalMessage(state.error, t('prices.loadFailed'), code =>
            t.has(`errors.${code}`) ? t(`errors.${code}`) : null
          )}
          retryLabel={tActions('retry')}
          onRetry={() => void reload()}
        />
      )}

      {state.kind === 'loaded' && groups.length === 0 && <PanelEmpty>{t('prices.empty')}</PanelEmpty>}

      {state.kind === 'loaded' &&
        groups.map(group => (
          <Box key={group.meter} component='section' sx={{ borderTop: '1px solid var(--mui-palette-divider)' }}>
            <PanelBody>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography component='h3' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>
                  {group.meter}
                </Typography>
                {group.in_force === null ? (
                  <StatusBadge color='warning' label={t('prices.noneInForce')} />
                ) : (
                  <StatusBadge color='success' label={t('prices.hasInForce')} />
                )}
                <Button size='small' sx={{ ml: 'auto' }} onClick={() => setAdding(group.meter)}>
                  {t('prices.addFor')}
                </Button>
              </Box>
              {group.in_force === null && (
                <Typography variant='caption' sx={{ display: 'block', mt: 1, ...mutedSx }}>
                  {t('prices.noneInForceHint')}
                </Typography>
              )}
            </PanelBody>

            <PanelTable>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('prices.columns.effectiveFrom')}</TableCell>
                    <TableCell align='right'>{t('prices.columns.vendorCost')}</TableCell>
                    <TableCell align='right'>{t('prices.columns.unitSize')}</TableCell>
                    <TableCell align='right'>{t('prices.columns.margin')}</TableCell>
                    <TableCell align='right'>{t('prices.columns.pointsPerUnit')}</TableCell>
                    <TableCell>{t('prices.columns.added')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.prices.map(price => (
                    <TableRow key={price.id} hover>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box component='span' sx={{ fontWeight: price.in_force ? 600 : 400 }}>
                            {formatMoment(price.effective_from, locale)}
                          </Box>
                          {price.in_force && <StatusBadge color='success' label={t('prices.inForce')} />}
                        </Box>
                      </TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {price.vendor_cost}
                      </TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {price.unit_size}
                      </TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {price.effective_margin}
                        {price.uses_default_margin && (
                          <Typography variant='caption' sx={{ display: 'block', ...mutedSx }}>
                            {t('prices.fromDefault')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {price.points_per_unit}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, ...mutedSx }}>{formatMoment(price.created_at, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
          </Box>
        ))}

      <MeterPriceAddDialog
        open={adding !== null}
        meter={adding ?? ''}
        defaultMargin={inheritedMargin(groups)}
        onClose={() => setAdding(null)}
        onAdded={onAdded}
      />
    </>
  )
}
