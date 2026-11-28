import Box from '@mui/material/Box'

import { useConsole } from '@/contexts/ConsoleContext'

export default function ExtensionVersion({ extensionKey }: { extensionKey: string }) {
  const { extensionVersions } = useConsole()

  if (!Object.hasOwn(extensionVersions, extensionKey)) return null

  return (
    <Box
      component='span'
      sx={{ color: 'var(--at-row-sub)', fontSize: 11, fontWeight: 400, whiteSpace: 'nowrap' }}
    >
      {' '}{extensionVersions[extensionKey]}
    </Box>
  )
}
