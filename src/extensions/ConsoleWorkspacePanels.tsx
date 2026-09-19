'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'

import { loadPluginExtensions } from './loadExtensionsCore'
import type { ConsoleWorkspacePanelExtension } from './registry'

interface Props {
  workspaceId: number
  isPlatformAdmin: boolean
}

/**
 * Loads console panels only for platform administrators.
 *
 * The API behind each panel remains the authority. Avoiding the plugin imports for
 * workspace owners also keeps private platform configuration out of their console UI.
 */
export default function ConsoleWorkspacePanels({ workspaceId, isPlatformAdmin }: Props) {
  const [panels, setPanels] = useState<ConsoleWorkspacePanelExtension[]>([])

  useEffect(() => {
    let cancelled = false

    if (!isPlatformAdmin) {
      setPanels([])

      return () => {
        cancelled = true
      }
    }

    loadPluginExtensions()
      .then(extensions => {
        if (cancelled) return

        setPanels(
          extensions
            .flatMap(extension => extension.consoleWorkspacePanels ?? [])
            .sort((left, right) => (right.priority ?? 100) - (left.priority ?? 100))
        )
      })
      .catch(error => {
        console.warn('[ConsoleWorkspacePanels] Failed to load extension panels:', error)
      })

    return () => {
      cancelled = true
    }
  }, [isPlatformAdmin])

  if (!isPlatformAdmin || panels.length === 0) return null

  return (
    <Box sx={{ display: 'grid', gap: 4, mt: 4 }}>
      {panels.map(panel => {
        const Panel = panel.component

        return <Panel key={panel.id} workspaceId={workspaceId} />
      })}
    </Box>
  )
}
