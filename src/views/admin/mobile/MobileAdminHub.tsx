'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'

export default function MobileAdminHub() {
  const router = useRouter()
  const t = useTranslations('admin.mobileAdmin')

  const tools = [
    {
      id: 'product-entry',
      label: t('hub.productEntry'),
      desc: t('hub.productEntryDesc'),
      icon: 'mdi:barcode-scan',
      path: '/admin/m/quick-entry/product',
    },
  ]

  return (
    <Box>
      <Paper variant='outlined'>
        <List disablePadding>
          {tools.map((tool, idx) => (
            <ListItemButton
              key={tool.id}
              onClick={() => router.push(tool.path)}
              divider={idx < tools.length - 1}
              sx={{ py: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <span className='iconify text-2xl' data-icon={tool.icon} />
              </ListItemIcon>
              <ListItemText
                primary={tool.label}
                secondary={tool.desc}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <span className='iconify text-gray-400' data-icon='mdi:chevron-right' />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  )
}
