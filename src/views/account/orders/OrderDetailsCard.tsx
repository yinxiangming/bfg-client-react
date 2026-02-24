'use client'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

interface OrderDetailsCardProps {
  order: any
}

const OrderDetailsCard = ({ order }: OrderDetailsCardProps) => {
  const t = useTranslations('account.orderDetail')
  const items = order.items || []
  const amounts = order.amounts || {}
  // Support both order.amounts and direct order fields
  const subtotal = amounts.subtotal || order.subtotal || 0
  const shippingCost = amounts.shipping_cost || order.shipping_cost || 0
  const tax = amounts.tax || order.tax || 0
  const discount = amounts.discount || order.discount || 0
  const total = amounts.total || order.total || 0
  const freightService = order.freight_service

  return (
    <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
      <CardHeader
        title={t('orderDetails')}
        sx={{
          '& .MuiCardHeader-title': {
            fontSize: '1.125rem',
            fontWeight: 500
          }
        }}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>{t('product')}</TableCell>
              <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>{t('sku')}</TableCell>
              <TableCell align='right' sx={{ color: 'text.primary', fontWeight: 500 }}>
                {t('price')}
              </TableCell>
              <TableCell align='right' sx={{ color: 'text.primary', fontWeight: 500 }}>
                {t('qty')}
              </TableCell>
              <TableCell align='right' sx={{ color: 'text.primary', fontWeight: 500 }}>
                {t('total')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <Typography variant='body2' color='text.secondary'>
                    {t('noItems')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: any, index: number) => (
                <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {item.product_name || item.name || t('unknownProduct')}
                    </Typography>
                    {item.variant_name && (
                      <Typography variant='caption' color='text.secondary'>
                        {item.variant_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {item.sku || t('na')}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color='text.secondary'>
                      {item.price ? `$${parseFloat(item.price).toFixed(2)}` : t('na')}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color='text.secondary'>
                      {item.quantity || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color='text.secondary'>
                      {item.subtotal ? `$${parseFloat(item.subtotal).toFixed(2)}` : t('na')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CardContent sx={{ px: 3, py: 3 }}>
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Grid container spacing={3}>
            {freightService && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1, fontWeight: 500 }}>
                  {t('shippingMethod')}
                </Typography>
                <Typography variant='body1' color='text.primary' sx={{ mb: 0.5 }}>
                  {freightService.name}
                </Typography>
                {freightService.carrier_name && (
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                    {t('carrier')}: {freightService.carrier_name}
                  </Typography>
                )}
                {freightService.estimated_days_min && freightService.estimated_days_max && (
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                    {t('estimatedDelivery', { min: freightService.estimated_days_min, max: freightService.estimated_days_max })}
                  </Typography>
                )}
              </Grid>
            )}
            <Grid size={{ xs: 12, md: freightService ? 6 : 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography color='text.secondary'>{t('subtotal')}:</Typography>
                    <Typography color='text.primary'>${parseFloat(String(subtotal)).toFixed(2)}</Typography>
                  </Box>
                  {parseFloat(String(shippingCost)) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography color='text.secondary'>{t('shipping')}:</Typography>
                      <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                        ${parseFloat(String(shippingCost)).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {parseFloat(String(tax)) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography color='text.secondary'>{t('tax')}:</Typography>
                      <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                        ${parseFloat(String(tax)).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {parseFloat(String(discount)) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography color='text.secondary'>{t('discount')}:</Typography>
                      <Typography color='success.main' sx={{ fontWeight: 500 }}>
                        -${parseFloat(String(discount)).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pt: 1.5,
                      borderTop: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                      {t('total')}:
                    </Typography>
                    <Typography color='text.primary' sx={{ fontWeight: 600 }}>
                      ${parseFloat(String(total)).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsCard
