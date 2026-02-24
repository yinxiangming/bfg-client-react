'use client'

type StorefrontDevBadgeProps = {
  label: string
  /** When true, use teal (default home); when false, use purple (CMS). */
  isDefaultHome?: boolean
}

export default function StorefrontDevBadge({ label, isDefaultHome = false }: StorefrontDevBadgeProps) {
  if (process.env.NODE_ENV !== 'development') return null
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
      }}
      title="Home content source"
    >
      {label}
    </div>
  )
}
