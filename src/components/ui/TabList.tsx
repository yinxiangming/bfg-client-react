'use client'

// MUI Imports
import MuiTabList from '@mui/lab/TabList'
import { styled } from '@mui/material/styles'
import type { TabListProps } from '@mui/lab/TabList'

// Type Imports
import type { ThemeColor } from '@/types/core'

export type CustomTabListProps = TabListProps & {
  color?: ThemeColor
  pill?: 'true' | 'false'
}

const TabList = styled(MuiTabList)<CustomTabListProps>(({ color, theme, pill, orientation }) => ({
  // Underline style (default)
  ...((pill === 'false' || !pill) && {
    minHeight: 40,
    '& .MuiTabs-indicator': {
      height: 2,
      backgroundColor: `var(--mui-palette-${color}-main)`
    },
    '& .MuiTabs-flexContainer': {
      gap: theme.spacing(4)
    },
    '& .MuiTab-root': {
      minHeight: 40,
      padding: theme.spacing(1, 0.5),
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: 0,
      color: 'var(--mui-palette-text-secondary)',
      textTransform: 'none',
      '& .tabler-currency-dollar, & .tabler-credit-card, & .tabler-receipt-tax, & .tabler-building-store, & .tabler-file-dollar, & .tabler-file-invoice': {
        fontSize: '1.125rem',
        marginRight: theme.spacing(1)
      },
      '&:hover': {
        color: 'var(--mui-palette-text-primary)'
      },
      '&.Mui-selected': {
        color: `var(--mui-palette-${color}-main)`,
        fontWeight: 600
      }
    }
  }),
  // Pill style
  ...(pill === 'true' && {
    minHeight: 32,
    ...(orientation === 'vertical'
      ? {
          borderInlineEnd: 0
        }
      : {
          borderBlockEnd: 0
        }),
    '&, & .MuiTabs-scroller': {
      ...(orientation === 'vertical' && {
        boxSizing: 'content-box'
      }),
      margin: `${theme.spacing(-1, -1, -1.5, -1)} !important`,
      padding: theme.spacing(1, 1, 1.5, 1)
    },
    '& .MuiTabs-indicator': {
      display: 'none'
    },
    '& .MuiTabs-flexContainer': {
      gap: theme.spacing(1)
    },
    '& .Mui-selected': {
      backgroundColor: `var(--mui-palette-${color}-main) !important`,
      color: `var(--mui-palette-${color}-contrastText) !important`,
      fontWeight: 600,
      boxShadow: `var(--mui-customShadows-${color}-sm)`
    },
    '& .MuiTab-root': {
      minHeight: 34,
      padding: theme.spacing(1, 2.5),
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: 0,
      // Sentence case, like the nav and every other label in the admin. MUI's
      // default uppercase only ever applied to the pill variant, so tab rails
      // shouted while the underline variant next to them did not.
      textTransform: 'none',
      gap: theme.spacing(1),
      borderRadius: 'var(--at-control-radius, 8px)',
      // Every tab icon, not the hand-listed few this used to cover.
      '& i': {
        fontSize: '1.0625rem'
      },
      '&:hover': {
        border: 0,
        backgroundColor: `var(--mui-palette-${color}-lightOpacity)`,
        color: `var(--mui-palette-${color}-main)`,
        ...(orientation === 'vertical'
          ? {
              paddingInlineEnd: theme.spacing(3.5)
            }
          : {
              paddingBlockEnd: theme.spacing(1.25)
            })
      }
    }
  })
}))

const CustomTabList = (props: CustomTabListProps) => {
  // Props
  const { color = 'primary', ...rest } = props

  return <TabList color={color} {...rest} />
}

export default CustomTabList

