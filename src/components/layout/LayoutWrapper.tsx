'use client'

// React Imports
import type { ReactElement } from 'react'

// Hook Imports
import { useAppLayout } from '@/hooks/useLayoutSettings'

type AppLayoutContainerProps = {
  sideMenuLayout: ReactElement
  topMenuLayout: ReactElement
}

const AppLayoutContainer = (props: AppLayoutContainerProps) => {
  // Props
  const { sideMenuLayout, topMenuLayout } = props

  // Hooks
  const { config } = useAppLayout()

  // Return the layout based on the menu position config
  return (
    <div className='flex flex-col flex-auto' data-theme-style={config.themeStyle}>
      {config.menuPosition === 'horizontal' ? topMenuLayout : sideMenuLayout}
    </div>
  )
}

export default AppLayoutContainer

