'use client'

import { Fragment, type CSSProperties } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import StatusBadge from '@/components/schema/StatusBadge'
import type { TenantWorkspace, TenantWorkspaceStatus } from '@/services/platform'

type BlockedReason = 'suspended' | 'inactive' | 'notMember'

/** Why this workspace's admin cannot be opened from here, or null when it can. */
function getBlockedReason(workspace: TenantWorkspace): BlockedReason | null {
  if (workspace.status === 'suspended') return 'suspended'
  if (workspace.status === 'inactive') return 'inactive'
  // switch-workspace refuses anyone who is not active staff there, owners included.
  // Servers that predate is_member leave it out, so only an explicit false counts.
  if (workspace.is_member === false) return 'notMember'
  return null
}

const STATUS_COLOR: Record<TenantWorkspaceStatus, 'success' | 'error' | 'default'> = {
  active: 'success',
  suspended: 'error',
  inactive: 'default'
}

/** Filled in by billing; until then each shows a dash. */
const BILLING_FIELDS = ['plan', 'credits', 'extensions'] as const

/** StatusBadge has no accent tone, and the current workspace is marked in the admin's accent. */
const CURRENT_BADGE_STYLE: CSSProperties = {
  background: 'var(--at-accent-soft)',
  color: 'var(--at-accent-soft-fg)',
  borderColor: 'color-mix(in srgb, var(--at-accent-soft-fg) 24%, transparent)'
}

type WorkspaceCardProps = {
  workspace: TenantWorkspace
  /** The access token was minted for this workspace. */
  isCurrent: boolean
  /** This workspace's admin is being opened. */
  entering: boolean
  /** Some workspace's admin is being opened, so no other can start. */
  busy: boolean
  /** Why the last attempt to open this workspace's admin failed. */
  enterError: string | null
  onEnter: () => void
  onDismissError: () => void
}

export default function WorkspaceCard({
  workspace,
  isCurrent,
  entering,
  busy,
  enterError,
  onEnter,
  onDismissError
}: WorkspaceCardProps) {
  const t = useTranslations('admin.workspaces')

  const blockedReason = getBlockedReason(workspace)
  const statusColor = STATUS_COLOR[workspace.status]
  // The roles every workspace gets have labels; a role a workspace made itself shows its code.
  const roleLabel = workspace.role
    ? (t.has(`roles.${workspace.role}`) ? t(`roles.${workspace.role}`) : workspace.role)
    : null
  const nameId = `workspace-${workspace.id}-name`
  const blockedId = `workspace-${workspace.id}-blocked`

  return (
    <Card component='section' aria-labelledby={nameId} sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          borderBottom: '1px solid var(--at-card-border)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography
            id={nameId}
            component='h2'
            sx={{
              minWidth: 0,
              overflowWrap: 'anywhere',
              fontFamily: 'var(--at-font-display)',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.5,
              color: 'var(--at-row-fg)'
            }}
          >
            {workspace.name}
          </Typography>
          {statusColor && <StatusBadge label={t(`status.${workspace.status}`)} color={statusColor} />}
        </Box>
        {(isCurrent || workspace.is_owner || roleLabel) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {isCurrent && (
              <span className='at-badge at-badge--no-dot' style={CURRENT_BADGE_STYLE}>
                {t('badges.current')}
              </span>
            )}
            {workspace.is_owner && <StatusBadge noDot color='info' label={t('badges.owner')} />}
            {roleLabel && <StatusBadge noDot label={roleLabel} />}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 3, py: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        <Box
          component='dl'
          sx={{
            m: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(56px, max-content) minmax(0, 1fr)',
            columnGap: 1.5,
            rowGap: 1,
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--at-row-fg)',
            '& dt': { fontSize: 12, color: 'var(--at-row-sub)' },
            '& dd': { m: 0, minWidth: 0, overflowWrap: 'anywhere' }
          }}
        >
          <dt>{t('fields.domain')}</dt>
          {workspace.domain ? (
            <dd>{workspace.domain}</dd>
          ) : (
            <Box component='dd' sx={{ color: 'var(--at-row-sub)' }}>
              {t('noDomain')}
            </Box>
          )}
          {BILLING_FIELDS.map(field => (
            <Fragment key={field}>
              <dt>{t(`fields.${field}`)}</dt>
              <Box component='dd' sx={{ color: 'text.disabled' }}>
                —
              </Box>
            </Fragment>
          ))}
        </Box>

        {enterError && (
          <Alert severity='error' onClose={onDismissError}>
            {enterError}
          </Alert>
        )}
      </Box>

      <Box
        sx={{
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderTop: '1px solid var(--at-card-border)'
        }}
      >
        <Button
          variant='contained'
          size='small'
          disabled={blockedReason !== null || busy}
          startIcon={entering ? <CircularProgress size={14} color='inherit' /> : undefined}
          aria-describedby={blockedReason ? blockedId : undefined}
          onClick={onEnter}
          sx={{ flexShrink: 0 }}
        >
          {t('enter')}
        </Button>
        {blockedReason && (
          <Typography
            id={blockedId}
            variant='caption'
            sx={{ ml: 'auto', textAlign: 'right', color: 'var(--at-row-sub)' }}
          >
            {t(`blocked.${blockedReason}`)}
          </Typography>
        )}
      </Box>
    </Card>
  )
}
