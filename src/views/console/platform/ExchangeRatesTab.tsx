'use client'

/**
 * The rates bills are converted at, newest day first.
 *
 * Rates are normally read from a reference feed once a day; a day the feed
 * could not be read leaves nothing billable in that currency, which is what
 * entering one by hand is for. Which of the two a row is matters long after it
 * was stored — "the bank published this" and "somebody typed this" are not the
 * same answer to why an invoice came to what it did — so every row says.
 */

import { useCallback, useEffect, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'

import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import { listExchangeRates, RATES_DEFAULT_LIMIT, type ConsoleExchangeRate } from '@/services/consoleAdmin'

import { formatDay } from '../billingPeriods'
import { refusalMessage } from '../refusal'
import { cellSx, mutedSx, PanelBar, PanelBody, PanelEmpty, PanelFailed, PanelSpinner, PanelTable, useLoad } from './panels'
import ExchangeRateAddDialog from './ExchangeRateAddDialog'

/** How long the panel waits after a keystroke before asking again. */
const FILTER_DELAY_MS = 300

/** A filter only narrows once it is a whole currency code; two letters match nothing. */
function asFilter(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
}

export default function ExchangeRatesTab() {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const [base, setBase] = useState('')
  const [currency, setCurrency] = useState('')
  const [filter, setFilter] = useState({ base: '', currency: '' })
  const [adding, setAdding] = useState(false)

  // A filter that comes out the same as the one in force keeps the object it
  // had: a new one of equal value would be a new request for the same listing,
  // which is what deleting a half-typed code produces.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = { base: base.length === 3 ? base : '', currency: currency.length === 3 ? currency : '' }

      setFilter(previous =>
        previous.base === next.base && previous.currency === next.currency ? previous : next
      )
    }, FILTER_DELAY_MS)

    return () => clearTimeout(timer)
  }, [base, currency])

  const load = useCallback(
    () => listExchangeRates({ base: filter.base, currency: filter.currency, limit: RATES_DEFAULT_LIMIT }),
    [filter]
  )
  const { state, reload, replace } = useLoad<ConsoleExchangeRate[]>(load)

  const rates = state.kind === 'loaded' ? state.data : []

  /**
   * Put the rate that was entered at the top of the list.
   *
   * A day already stored is corrected rather than duplicated on the server, so
   * the row it replaces is dropped here by its id instead of appearing twice.
   */
  const onAdded = (added: ConsoleExchangeRate) => {
    replace([added, ...rates.filter(rate => rate.id !== added.id)])
    setAdding(false)
  }

  return (
    <>
      <PanelBar hint={t('rates.hint')}>
        <TextField
          size='small'
          value={base}
          onChange={event => setBase(asFilter(event.target.value))}
          label={t('rates.columns.from')}
          sx={{ width: 110 }}
        />
        <TextField
          size='small'
          value={currency}
          onChange={event => setCurrency(asFilter(event.target.value))}
          label={t('rates.columns.to')}
          sx={{ width: 110 }}
        />
        <Button size='small' variant='contained' startIcon={<Icon icon='tabler-plus' />} onClick={() => setAdding(true)}>
          {t('rates.add')}
        </Button>
      </PanelBar>

      <PanelBody>
        <Alert severity='info'>{t('rates.overwritten')}</Alert>
      </PanelBody>

      {state.kind === 'loading' && <PanelSpinner label={t('rates.loading')} />}

      {state.kind === 'failed' && (
        <PanelFailed
          message={refusalMessage(state.error, t('rates.loadFailed'), code =>
            t.has(`errors.${code}`) ? t(`errors.${code}`) : null
          )}
          retryLabel={tActions('retry')}
          onRetry={() => void reload()}
        />
      )}

      {state.kind === 'loaded' && rates.length === 0 && <PanelEmpty>{t('rates.empty')}</PanelEmpty>}

      {state.kind === 'loaded' && rates.length > 0 && (
        <PanelTable>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('rates.columns.day')}</TableCell>
                <TableCell>{t('rates.columns.pair')}</TableCell>
                <TableCell align='right'>{t('rates.columns.rate')}</TableCell>
                <TableCell>{t('rates.columns.source')}</TableCell>
                <TableCell>{t('rates.columns.enteredBy')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id} hover>
                  <TableCell sx={cellSx}>{formatDay(rate.effective_date, locale)}</TableCell>
                  <TableCell sx={cellSx}>{`${rate.from} → ${rate.to}`}</TableCell>
                  <TableCell align='right' sx={cellSx}>
                    {rate.rate}
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <StatusBadge
                      noDot
                      color={rate.source === 'manual' ? 'warning' : 'default'}
                      label={t(rate.source === 'manual' ? 'rates.manual' : 'rates.feed')}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    {rate.entered_by?.username ?? (
                      <Box component='span' sx={mutedSx}>
                        —
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PanelTable>
      )}

      <ExchangeRateAddDialog open={adding} onClose={() => setAdding(false)} onAdded={onAdded} />
    </>
  )
}
