'use client'

/**
 * One workspace's monthly usage cap, for a platform administrator.
 *
 * The usage page shows the cap among the month's figures, where it reads as one
 * more number about the month. Here it reads as a setting: what is enforced,
 * where that number comes from, and the way to change it. Its owner sees
 * neither the card nor the endpoint behind it — a cap is the platform's
 * decision, and the server refuses an owner who asks.
 *
 * Changing it also puts the month's figures out of date, since the allowance
 * they are measured against has just moved, so the page is asked to read them
 * again rather than left showing the old one next to the new.
 */

import { useCallback, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import StatusBadge from '@/components/schema/StatusBadge'
import { getWorkspaceUsageCap, type ConsoleUsageCap } from '@/services/consoleAdmin'

import { refusalMessage } from './refusal'
import SectionCard from './SectionCard'
import WorkspaceUsageCapDialog from './WorkspaceUsageCapDialog'

type State =
  | { kind: 'loading' }
  | { kind: 'failed'; error: unknown }
  | { kind: 'loaded'; cap: ConsoleUsageCap }

type Props = {
  workspaceId: number
  /** Read the month's figures again: what they are measured against has changed. */
  onChanged: () => void
}

export default function WorkspaceUsageCapCard({ workspaceId, onChanged }: Props) {
  const t = useTranslations('admin.console.usage.allowance')
  const tActions = useTranslations('admin.common.actions')
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [changing, setChanging] = useState(false)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })

    try {
      setState({ kind: 'loaded', cap: await getWorkspaceUsageCap(workspaceId) })
    } catch (error) {
      setState({ kind: 'failed', error })
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const cap = state.kind === 'loaded' ? state.cap : null

  const onCapChanged = (changed: ConsoleUsageCap) => {
    setState({ kind: 'loaded', cap: changed })
    setChanging(false)
    onChanged()
  }

  return (
    <>
      <SectionCard
        title={t('title')}
        actions={
          cap && (
            <Button size='small' variant='outlined' onClick={() => setChanging(true)}>
              {t('change')}
            </Button>
          )
        }
      >
        {state.kind === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={22} aria-label={t('loading')} />
          </Box>
        )}

        {state.kind === 'failed' && (
          <Box sx={{ px: 4, py: 4 }}>
            <Alert
              severity='error'
              action={
                <Button color='inherit' size='small' onClick={() => void load()}>
                  {tActions('retry')}
                </Button>
              }
            >
              {refusalMessage(state.error, t('loadFailed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null))}
            </Alert>
          </Box>
        )}

        {cap && (
          <Box sx={{ px: 4, py: 4, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ fontSize: 20, fontWeight: 600, color: 'var(--at-row-fg)' }}>
                {t('points', { points: cap.effective_cap_points })}
              </Box>
              <StatusBadge
                noDot
                color={cap.source === 'workspace' ? 'info' : 'default'}
                label={t(cap.source === 'workspace' ? 'ownSource' : 'platformSource')}
              />
            </Box>
            <Typography variant='body2' sx={{ color: 'var(--at-row-sub)' }}>
              {cap.source === 'workspace'
                ? t('ownExplains', { points: cap.default_cap_points })
                : t('platformExplains', { points: cap.default_cap_points })}
            </Typography>
          </Box>
        )}
      </SectionCard>

      {cap && (
        <WorkspaceUsageCapDialog
          open={changing}
          workspaceId={workspaceId}
          cap={cap}
          onClose={() => setChanging(false)}
          onChanged={onCapChanged}
        />
      )}
    </>
  )
}
