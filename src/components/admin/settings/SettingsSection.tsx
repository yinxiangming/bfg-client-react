'use client'

/**
 * Layout primitives for admin settings panels.
 *
 * The settings tabs used to stack `<Card variant='outlined'>` blocks inside the
 * page card, which meant every section paid for two borders and two 24px
 * paddings before its first field — the content read far looser than the nav
 * rail next to it. These primitives put one surface under everything and
 * separate sections with hairlines instead: a fixed label rail on the left
 * (title + purpose) and a width-capped control column on the right, so field
 * rows line up down the whole page instead of stretching to the viewport.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Label rail width. Matches the nav rail's optical weight at 1440px and up. */
const RAIL_WIDTH = 220

/**
 * Control column cap. Long single-line inputs stop being readable past ~720px,
 * and an uncapped column is what made three side-by-side selects look adrift.
 */
const CONTENT_MAX_WIDTH = 760

/** Horizontal gutter shared by every settings row, incl. the tab rail and action bar. */
export const SETTINGS_GUTTER = { xs: 4, md: 6 }

type SettingsSectionProps = {
  title: string
  /** One line on what the section controls. Sits under the title in the rail. */
  description?: string
  /** Section-level control (edit toggle, link). Rendered under the description. */
  action?: ReactNode
  /** Omit the top hairline — use on the first section of a panel. */
  flush?: boolean
  children: ReactNode
}

export const SettingsSection = ({ title, description, action, flush, children }: SettingsSectionProps) => (
  <Box
    component='section'
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', lg: `${RAIL_WIDTH}px minmax(0, 1fr)` },
      columnGap: 6,
      rowGap: 3,
      px: SETTINGS_GUTTER,
      py: 5,
      ...(flush ? {} : { borderTop: '1px solid', borderColor: 'divider' })
    }}
  >
    <Box>
      <Typography
        component='h3'
        sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, color: 'text.primary' }}
      >
        {title}
      </Typography>
      {description && (
        <Typography sx={{ mt: 0.5, fontSize: '0.75rem', lineHeight: 1.6, color: 'text.secondary' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>

    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, minWidth: 0 }}>{children}</Box>
  </Box>
)

type ReadOnlyFieldProps = {
  label: ReactNode
  value?: string
  /** Long free text (notes, addresses) keeps its line breaks and wraps on words. */
  multiline?: boolean
}

/** Label-over-value pair for sections that are read-only until you enter edit mode. */
export const ReadOnlyField = ({ label, value, multiline }: ReadOnlyFieldProps) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap', mb: 0.5 }}>
      {typeof label === 'string' ? (
        <Typography component='span' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {label}
        </Typography>
      ) : (
        label
      )}
    </Box>
    <Typography
      sx={{
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.6,
        color: value ? 'text.primary' : 'text.disabled',
        ...(multiline
          ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
          : { wordBreak: 'break-word' })
      }}
    >
      {value || '—'}
    </Typography>
  </Box>
)

/**
 * Docks the panel's save/reset controls to the bottom of the viewport while the
 * form scrolls. Settings pages are long; the previous buttons sat at the very
 * end and were off-screen for most of the edit.
 */
export const SettingsActionBar = ({ children }: { children: ReactNode }) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [floating, setFloating] = useState(false)

  // The bar only earns a shadow while it is lifted off its resting place and
  // covering content; once you reach the end of the form it settles into the
  // card and the shadow goes away. The sentinel is the bar's flow position.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setFloating(!entry.isIntersecting), {
      threshold: 1
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          px: SETTINGS_GUTTER,
          py: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'box-shadow 160ms ease',
          boxShadow: floating ? '0 -6px 16px -12px rgba(15, 18, 45, 0.55)' : 'none',
          // The card clips its own corners; match them so the bar doesn't square
          // off the bottom of the surface it sits on.
          borderEndStartRadius: 'inherit',
          borderEndEndRadius: 'inherit'
        }}
      >
        {children}
      </Box>
      <Box ref={sentinelRef} aria-hidden sx={{ height: '1px' }} />
    </>
  )
}
