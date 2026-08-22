'use client'

/**
 * The page header every admin route opens with.
 *
 * Three shapes had grown up side by side: settings pages rendered a title plus
 * a one-line subtitle, Orders/Customers/Tickets rendered a bare `h4`, and the
 * list pages (Products, Listings, Reviews) rendered nothing at all — you landed
 * on a filter bar with no idea what you were looking at. This is that first
 * shape, factored out, so the difference between pages is the copy and nothing
 * else.
 *
 * The `h4` looks oversized in isolation: `styles/layout.css` compacts
 * `.d365-content-body .MuiTypography-h4` to 1.125rem for the admin shell.
 */

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type AdminPageHeaderProps = {
  title: string
  /** One line on what the page is for. Sits under the title. */
  subtitle?: string
  /** Page-level controls, right-aligned on the title row. */
  actions?: ReactNode
}

export const AdminPageHeader = ({ title, subtitle, actions }: AdminPageHeaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 2,
      mb: 4
    }}
  >
    <div>
      <Typography variant='h4' sx={{ mb: subtitle ? 1 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant='body2' color='text.secondary'>
          {subtitle}
        </Typography>
      )}
    </div>
    {actions && <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>{actions}</Box>}
  </Box>
)

export default AdminPageHeader
