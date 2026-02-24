'use client'

// React Imports
import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Icon Imports
import Icon from '@/components/Icon'

// Type Imports
import type { Customer } from '@/services/store'

import { getIntlLocale } from '@/utils/format'

type CustomerEditHeaderProps = {
  customer: Customer
  onDelete?: () => void
  onResetPassword?: () => void
}

const CustomerEditHeader = ({ customer, onDelete, onResetPassword }: CustomerEditHeaderProps) => {
  const t = useTranslations('admin')
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  
  const isNew = customer.id === 0

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant='h5'>
            {isNew ? t('customers.editHeader.addCustomer') : (
              customer.user?.first_name || customer.user?.last_name
                ? `${customer.user.first_name || ''} ${customer.user.last_name || ''}`.trim()
                : customer.company_name || customer.user_email || `Customer #${customer.customer_number || customer.id}`
            )}
          </Typography>
          {!isNew && customer.customer_number && (
            <Typography variant='body2' color='text.secondary'>
              {t('customers.editHeader.customerNumber')}: {customer.customer_number}
            </Typography>
          )}
        </Box>
        {!isNew && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {customer.is_verified && (
              <Chip
                label={t('customers.editHeader.verified')}
                color='info'
                variant='filled'
                size='small'
              />
            )}
            <IconButton onClick={handleActionMenuOpen}>
              <Icon icon='tabler:dots-vertical' />
            </IconButton>
          <Menu
            anchorEl={actionMenuAnchor}
            open={Boolean(actionMenuAnchor)}
            onClose={handleActionMenuClose}
          >
            {onResetPassword && (
              <MenuItem onClick={() => {
                handleActionMenuClose()
                onResetPassword()
              }}>
                <ListItemIcon>
                  <Icon icon='tabler:key' width={20} height={20} />
                </ListItemIcon>
                <ListItemText>{t('customers.editHeader.resetPassword')}</ListItemText>
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={() => {
                  handleActionMenuClose()
                  onDelete()
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <Icon icon='tabler:trash' width={20} height={20} />
                </ListItemIcon>
                <ListItemText>{t('customers.editHeader.deleteCustomer')}</ListItemText>
              </MenuItem>
            )}
          </Menu>
          </Box>
        )}
      </Box>
      {!isNew && customer.created_at && (
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.875rem' }}>
          {t('customers.editHeader.createdAt', { date: formatDate(customer.created_at) })}
        </Typography>
      )}
    </Box>
  )
}

export default CustomerEditHeader
