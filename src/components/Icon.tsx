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
  return <Iconify icon={icon} className={className} width={width || '1em'} height={height || '1em'} />
}

export default Icon

