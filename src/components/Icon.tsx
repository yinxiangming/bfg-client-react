'use client'

// Iconify React Component
import { Icon as Iconify } from '@iconify/react'

type IconProps = {
  icon: string
  className?: string
  width?: string | number
  height?: string | number
}

const Icon = ({ icon, className, width, height }: IconProps) => {
  // Tabler icons are bundled by the host; render without a remote Iconify request.
  if (/^tabler[-:]/.test(icon)) {
    const name = icon.replace(/^tabler:/, 'tabler-')
    return <span aria-hidden='true' className={[name, className].filter(Boolean).join(' ')} style={{width: width || '1em', height: height || '1em', flexShrink: 0}} />
  }
  return <Iconify icon={icon} className={className} width={width || '1em'} height={height || '1em'} />
}

export default Icon

