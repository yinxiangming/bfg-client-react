'use client'

/**
 * A titled block on a console page.
 *
 * The usage page stacks several of these and the cap sits among them, so the
 * heading rule lives in one place rather than being copied per card and drifting
 * a pixel at a time.
 */

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

type Props = {
  title: string
  /** Controls on the title row, right-aligned. */
  actions?: ReactNode
  children: ReactNode
}

export default function SectionCard({ title, actions, children }: Props) {
  return (
    <Card component='section'>
      <Box
        sx={{
          px: 4,
          py: 3,
          borderBottom: '1px solid var(--at-card-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>
          {title}
        </Typography>
        {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>{actions}</Box>}
      </Box>
      {children}
    </Card>
  )
}
