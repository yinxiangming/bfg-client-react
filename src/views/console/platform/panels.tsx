'use client'

/**
 * The pieces every panel of the platform settings page is built from.
 *
 * Each panel is a bar of controls over a table, sitting flush inside the page's
 * one card, so the three read as one surface rather than as three cards stacked
 * in a card. The gutter is the settings pages' own, so the bar lines up with
 * the tab rail beside it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { SETTINGS_GUTTER } from '@/components/admin/settings/SettingsSection'

/** Cells across these tables: the console's own row type, and never wrapped. */
export const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', whiteSpace: 'nowrap' as const }

/** Secondary text: a default a value came from, a key nobody has to read closely. */
export const mutedSx = { color: 'var(--at-row-sub)' }

/**
 * A platform variable's value as a reader reads it.
 *
 * A decimal arrives as a string and is printed as it arrived — a margin put
 * through a float comes back a fraction out of what was typed, and nothing here
 * calculates with it — while true and false are words rather than the JSON.
 */
export function variableText(value: unknown, labels: { yes: string; no: string }): string {
  if (typeof value === 'boolean') return value ? labels.yes : labels.no

  return String(value)
}

/** The controls over a panel's table: what it is for on the left, what it does on the right. */
export function PanelBar({ hint, children }: { hint?: ReactNode; children?: ReactNode }) {
  return (
    <Box
      sx={{
        px: SETTINGS_GUTTER,
        py: 4,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 3,
        borderBottom: '1px solid var(--mui-palette-divider)'
      }}
    >
      {hint && (
        <Typography variant='body2' sx={{ flex: '1 1 320px', minWidth: 0, ...mutedSx }}>
          {hint}
        </Typography>
      )}
      {children && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>{children}</Box>}
    </Box>
  )
}

/** Loose content inside a panel — an alert, a form — with the gutter around it. */
export function PanelBody({ children }: { children: ReactNode }) {
  return <Box sx={{ px: SETTINGS_GUTTER, py: 4 }}>{children}</Box>
}

/** A table too wide for the panel scrolls sideways rather than pushing the page. */
export function PanelTable({ children }: { children: ReactNode }) {
  return <Box sx={{ overflowX: 'auto' }}>{children}</Box>
}

export function PanelSpinner({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={28} aria-label={label} />
    </Box>
  )
}

/** Nothing to show yet, said in words rather than left as an empty table. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return <Box sx={{ px: SETTINGS_GUTTER, py: 10, textAlign: 'center', fontSize: 13, ...mutedSx }}>{children}</Box>
}

export function PanelFailed({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <PanelBody>
      <Alert
        severity='error'
        action={
          <Button color='inherit' size='small' onClick={onRetry}>
            {retryLabel}
          </Button>
        }
      >
        {message}
      </Alert>
    </PanelBody>
  )
}

export type LoadState<T> = { kind: 'loading' } | { kind: 'failed'; error: unknown } | { kind: 'loaded'; data: T }

/**
 * One panel's data, read when the panel opens and whenever `load` changes.
 *
 * `load` is the caller's memoised request, so a panel that narrows its listing
 * asks again by handing over a different one rather than by remembering to call
 * `reload` itself.
 *
 * The error object is kept rather than its message, because a refusal's meaning
 * is in its `code`, which a panel turns into its own wording; a hook that
 * reduced the failure to the server's sentence would leave nothing to read it
 * from. An answer that arrives after the panel has asked again is dropped — what
 * a reader typing into a filter produces — or a slow first request would land on
 * top of the narrowed one.
 */
export function useLoad<T>(load: () => Promise<T>) {
  const [state, setState] = useState<LoadState<T>>({ kind: 'loading' })
  const currentRequest = useRef(0)

  const reload = useCallback(async () => {
    const request = currentRequest.current + 1

    currentRequest.current = request
    setState({ kind: 'loading' })

    try {
      const data = await load()

      if (currentRequest.current === request) setState({ kind: 'loaded', data })
    } catch (error) {
      if (currentRequest.current === request) setState({ kind: 'failed', error })
    }
  }, [load])

  useEffect(() => {
    void reload()

    // An answer for a listing the panel has left is no longer anyone's.
    return () => {
      currentRequest.current += 1
    }
  }, [reload])

  /** Put a changed answer in place, for a write that already returned the new state. */
  const replace = useCallback((data: T) => setState({ kind: 'loaded', data }), [])

  return { state, reload, replace }
}
