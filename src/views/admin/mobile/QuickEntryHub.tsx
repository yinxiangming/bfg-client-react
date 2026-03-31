'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

export default function QuickEntryHub() {
  const router = useRouter()
  const t = useTranslations('admin.mobileAdmin')

  const entryTypes = [
    {
      id: 'product',
      label: t('quickEntry.product'),
      desc: t('quickEntry.productDesc'),
      icon: 'mdi:barcode-scan',
      path: '/admin/m/quick-entry/product',
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton size='small' onClick={() => router.push('/admin/m')} title={t('quickEntry.back')}>
          <span className='iconify' data-icon='mdi:arrow-left' />
        </IconButton>
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          {t('quickEntry.title')}
        </Typography>
      </Box>
      <Paper variant='outlined'>
        <List disablePadding>
          {entryTypes.map((item, idx) => (
            <ListItemButton
              key={item.id}
              onClick={() => router.push(item.path)}
              divider={idx < entryTypes.length - 1}
              sx={{ py: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <span className='iconify text-2xl' data-icon={item.icon} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.desc}
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
