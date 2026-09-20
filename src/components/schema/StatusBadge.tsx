// Tonal status badge used by SchemaTable in place of a solid MUI Chip.
// The tone classes resolve to skin tokens (--at-ok/warn/err/info/neu) so the
// badge restyles automatically when the admin skin or color mode changes.

type MuiStatusColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

const TONE_CLASS: Record<MuiStatusColor, string> = {
  success: 'at-badge--ok',
  warning: 'at-badge--warn',
  error: 'at-badge--err',
  info: 'at-badge--info',
  primary: 'at-badge--info',
  default: 'at-badge--neu'
}

type StatusBadgeProps = {
  label: React.ReactNode
  color?: MuiStatusColor
  /** Hide the leading dot (e.g. for plain tag lists like warehouses). */
  noDot?: boolean
}

export default function StatusBadge({ label, color = 'default', noDot = false }: StatusBadgeProps) {
  return (
    <span className={`at-badge ${TONE_CLASS[color]}${noDot ? ' at-badge--no-dot' : ''}`}>
      {label}
    </span>
  )
}
