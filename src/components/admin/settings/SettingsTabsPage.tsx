'use client'

/**
 * The shell every admin settings page is built from.
 *
 * Settings/General, Store, Web, Finance, Delivery, Marketing and Support each
 * carried their own copy of this scaffold and they had drifted apart — one put
 * its tabs across the top, the others down the side, each with its own
 * paddings and borders. One shell now: page header, one card, a vertical tab
 * rail, and panels that sit flush inside the card so a table reads as part of
 * the surface instead of a card floating in a card.
 *
 * The rail is vertical because these sections keep growing (Web is already at
 * eleven): a column takes another entry without reflowing anything, while a
 * horizontal strip starts scrolling and hides the tail behind a chevron.
 */

import { useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import CustomTabList from '@/components/ui/TabList'
import { SETTINGS_GUTTER } from './SettingsSection'

export type SettingsTab = {
  value: string
  label: string
  /** Tabler icon class, e.g. `tabler-building`. */
  icon?: string
  content: ReactNode
  /**
   * `flush` (default) — the panel brings its own surface (a SchemaTable or a
   * stack of `SettingsSection`s) and is laid edge to edge.
   * `padded` — loose content that needs the standard gutter around it.
   */
  layout?: 'flush' | 'padded'
}

/** Rail width. Same 220px as the section label rail, so the two line up. */
const RAIL_WIDTH = 220

/**
 * Panels host components that render their own `Card` (SchemaTable and
 * friends). Inside the page card that reads as a box in a box — two borders,
 * two radii, doubled padding. Strip the inner surface and let the page card be
 * the only one.
 */
export const flushPanelSx = {
  p: 0,
  // Descendant, not child: tabs wrap their table or form in a Box often enough
  // that a `>` selector misses half of them and the card-in-card comes back.
  // `&&` doubles the class so this outranks the theme's own MuiCard rule, which
  // otherwise ties on specificity and wins on source order.
  '&& .MuiCard-root': {
    border: 0,
    borderRadius: 0,
    boxShadow: 'none',
    backgroundColor: 'transparent'
  }
}

export const paddedPanelSx = {
  px: SETTINGS_GUTTER,
  py: 5
}

type SettingsTabRailProps = {
  tabs: Array<Pick<SettingsTab, 'value' | 'label' | 'icon'>>
  onChange: (event: SyntheticEvent, value: string) => void
}

/**
 * Vertical tab rail. Rows echo the main nav — same height, radius and icon
 * size — so the eye reads one continuous navigation depth rather than two
 * competing sidebars.
 */
export const SettingsTabRail = ({ tabs, onChange }: SettingsTabRailProps) => {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box
      sx={{
        width: { md: RAIL_WIDTH },
        minWidth: { md: RAIL_WIDTH },
        flexShrink: 0,
        p: 2,
        // Colour inside the shorthand, not as a sibling `borderColor`. A
        // responsive shorthand lands in a media query that re-resolves
        // border-*-color to currentColor, so the sibling declaration loses and
        // the rule paints near-black in light mode.
        borderRight: { md: '1px solid var(--mui-palette-divider)' },
        borderBottom: { xs: '1px solid var(--mui-palette-divider)', md: 'none' }
      }}
    >
      <CustomTabList
        onChange={onChange}
        orientation={isMdUp ? 'vertical' : 'horizontal'}
        variant={isMdUp ? 'standard' : 'scrollable'}
        pill='true'
        sx={{
          borderRight: 0,
          '& .MuiTabs-flexContainer': { gap: 0.25 },
          '& .MuiTab-root': {
            justifyContent: 'flex-start',
            textAlign: 'left',
            width: { md: '100%' },
            maxWidth: 'none',
            minHeight: 36
          }
        }}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={tab.icon ? <i className={tab.icon} /> : undefined}
            iconPosition='start'
          />
        ))}
      </CustomTabList>
    </Box>
  )
}

type SettingsCardProps = {
  activeTab: string
  tabs: Array<Pick<SettingsTab, 'value' | 'label' | 'icon'>>
  onTabChange: (event: SyntheticEvent, value: string) => void
  /** `<TabPanel>` elements for each tab value. */
  children: ReactNode
}

/** Card + rail + panel column. Used directly by pages with bespoke panels. */
export const SettingsCard = ({ activeTab, tabs, onTabChange, children }: SettingsCardProps) => (
  <Card sx={{ overflow: 'visible' }}>
    <TabContext value={activeTab}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
        <SettingsTabRail tabs={tabs} onChange={onTabChange} />
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Box>
    </TabContext>
  </Card>
)

type SettingsTabsPageProps = {
  title: string
  subtitle?: string
  tabs: SettingsTab[]
  defaultTab?: string
  /** Rendered between the page header and the card (alerts, extension slots). */
  beforeCard?: ReactNode
  afterCard?: ReactNode
}

export const SettingsTabsPage = ({
  title,
  subtitle,
  tabs,
  defaultTab,
  beforeCard,
  afterCard
}: SettingsTabsPageProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.value ?? '')

  const handleTabChange = (_event: SyntheticEvent, value: string) => setActiveTab(value)

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <div>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant='body2' color='text.secondary'>
              {subtitle}
            </Typography>
          )}
        </div>
      </Grid>

      {beforeCard}

      <Grid size={{ xs: 12 }}>
        <SettingsCard activeTab={activeTab} tabs={tabs} onTabChange={handleTabChange}>
          {tabs.map(tab => (
            <TabPanel
              key={tab.value}
              value={tab.value}
              sx={tab.layout === 'padded' ? paddedPanelSx : flushPanelSx}
            >
              {tab.content}
            </TabPanel>
          ))}
        </SettingsCard>
      </Grid>

      {afterCard}
    </Grid>
  )
}

export default SettingsTabsPage
