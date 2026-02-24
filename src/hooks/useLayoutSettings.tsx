// React Imports
import { useContext } from 'react'

// Context Imports
import { AppLayoutContext } from '@/contexts/LayoutSettingsContext'

export const useAppLayout = () => {
  // Hooks
  const context = useContext(AppLayoutContext)

  if (!context) {
    throw new Error('useAppLayout must be used within an AppLayoutProvider')
  }

  return context
}

