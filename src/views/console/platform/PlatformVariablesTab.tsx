'use client'

/**
 * The deployment's own numbers: margins, grace periods, retention, the default cap.
 *
 * Every variable the deployment declares is listed, whether or not anyone has
 * ever set it, because a list of overrides alone would not say what *can* be
 * set. A row shows what is in force, what it would be with nothing set, and —
 * for one that has been changed — the reason whoever changed it gave, which is
 * the whole point of making a reason compulsory.
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

import StatusBadge from '@/components/schema/StatusBadge'
import { listPlatformVariables, type ConsolePlatformVariable } from '@/services/consoleAdmin'

import { formatMoment } from '../billingPeriods'
import { refusalMessage } from '../refusal'
import {
  cellSx,
  mutedSx,
  PanelBar,
  PanelEmpty,
  PanelFailed,
  PanelSpinner,
  PanelTable,
  useLoad,
  variableText
} from './panels'
import VariableChangeDialog from './VariableChangeDialog'

export default function PlatformVariablesTab() {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const load = useCallback(() => listPlatformVariables(), [])
  const { state, reload, replace } = useLoad<ConsolePlatformVariable[]>(load)
  const [editing, setEditing] = useState<ConsolePlatformVariable | null>(null)

  const labels = { yes: t('variables.true'), no: t('variables.false') }

  /** Put the changed variable back in its row, so a change does not reload the panel. */
  const onChanged = (changed: ConsolePlatformVariable) => {
    if (state.kind === 'loaded') {
      replace(state.data.map(variable => (variable.key === changed.key ? changed : variable)))
    }

    setEditing(null)
  }

  return (
    <>
      <PanelBar hint={t('variables.hint')} />

      {state.kind === 'loading' && <PanelSpinner label={t('variables.loading')} />}

      {state.kind === 'failed' && (
        <PanelFailed
          message={refusalMessage(state.error, t('variables.loadFailed'), code =>
            t.has(`errors.${code}`) ? t(`errors.${code}`) : null
          )}
          retryLabel={tActions('retry')}
          onRetry={() => void reload()}
        />
      )}

      {state.kind === 'loaded' && state.data.length === 0 && <PanelEmpty>{t('variables.empty')}</PanelEmpty>}

      {state.kind === 'loaded' && state.data.length > 0 && (
        <PanelTable>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('variables.columns.variable')}</TableCell>
                <TableCell>{t('variables.columns.value')}</TableCell>
                <TableCell>{t('variables.columns.default')}</TableCell>
                <TableCell>{t('variables.columns.lastChange')}</TableCell>
                <TableCell align='right' />
              </TableRow>
            </TableHead>
            <TableBody>
              {state.data.map(variable => {
                const change = variable.last_change

                return (
                  <TableRow key={variable.key} hover>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'normal' }}>
                      <Box sx={{ fontWeight: 600 }}>{variable.key}</Box>
                      <Typography variant='caption' sx={{ display: 'block', textWrap: 'pretty', ...mutedSx }}>
                        {variable.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box component='span' sx={{ fontWeight: 600 }}>
                          {variableText(variable.value, labels)}
                        </Box>
                        {variable.overridden && <StatusBadge noDot color='info' label={t('variables.overridden')} />}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, ...mutedSx }}>{variableText(variable.default, labels)}</TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'normal', maxWidth: 320 }}>
                      {change ? (
                        <>
                          <Box sx={{ textWrap: 'pretty' }}>{change.reason || t('variables.noReason')}</Box>
                          <Typography variant='caption' sx={{ display: 'block', ...mutedSx }}>
                            {t('variables.changedBy', {
                              who: change.changed_by?.username ?? t('variables.someone'),
                              when: formatMoment(change.changed_at, locale)
                            })}
                          </Typography>
                        </>
                      ) : (
                        <Box component='span' sx={mutedSx}>
                          {t('variables.neverChanged')}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Button size='small' onClick={() => setEditing(variable)}>
                        {t('variables.changeAction')}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </PanelTable>
      )}

      <VariableChangeDialog variable={editing} onClose={() => setEditing(null)} onChanged={onChanged} />
    </>
  )
}
