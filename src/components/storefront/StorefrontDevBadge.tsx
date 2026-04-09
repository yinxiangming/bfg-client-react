'use client'

type StorefrontDevBadgeProps = {
  label: string
  /** When true, use teal (default home); when false, use purple (CMS). */
  isDefaultHome?: boolean
  workspaceId?: number
  workspaceSlug?: string
}

function formatWorkspaceSuffix(workspaceId?: number, workspaceSlug?: string): string | null {
  if (workspaceId == null && (workspaceSlug == null || workspaceSlug === '')) return null
  const parts: string[] = []
  if (workspaceId != null) parts.push(`id ${workspaceId}`)
  if (workspaceSlug) parts.push(`slug ${workspaceSlug}`)
  return parts.length ? parts.join(' · ') : null
}

export default function StorefrontDevBadge({
  label,
  isDefaultHome = false,
  workspaceId,
  workspaceSlug,
}: StorefrontDevBadgeProps) {
  if (process.env.NODE_ENV !== 'development') return null
  const ws = formatWorkspaceSuffix(workspaceId, workspaceSlug)
  const text = ws ? `${label} · ${ws}` : label
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        padding: '4px 8px',
        fontSize: 11,
        background: isDefaultHome ? '#0d9488' : '#7c3aed',
        color: '#fff',
        borderRadius: 4,
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: 'min(96vw, 520px)',
        lineHeight: 1.35,
        wordBreak: 'break-word',
      }}
      title="Home content source and resolved workspace"
    >
      {text}
    </div>
  )
}
