'use client'

// React Imports
import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'

type OrderItem = {
  id: number
  product: number
  product_name: string
  variant_name?: string
  sku?: string
  quantity: number
  price: number | string
  subtotal: number | string
}

type OrderDetail = {
  id: number
  order_number: string
  items?: OrderItem[]
  subtotal?: number
  shipping_cost?: number
  tax?: number
  discount?: number
  total: number
  freight_service?: {
    id: number
    name: string
    code: string
    carrier_name?: string
    estimated_days_min?: number
    estimated_days_max?: number
  } | null
}

type OrderDetailsCardProps = {
  order: OrderDetail
  onOrderUpdate?: (updatedOrder: OrderDetail) => void
}

const OrderDetailsCard = ({ order, onOrderUpdate }: OrderDetailsCardProps) => {
  const t = useTranslations('admin')
  const items = order.items || []
  const subtotal = order.subtotal || 0
  const shippingCost = order.shipping_cost || 0
  const tax = order.tax || 0
  const discount = order.discount || 0
  const total = order.total || 0

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `$${numAmount.toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader title={t('orders.detailsCard.title')} />
      <CardContent>
        {items.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            {t('orders.detailsCard.empty')}
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} variant='outlined' sx={{ mb: 3 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orders.detailsCard.table.headers.product')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.price')}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.quantity')}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.total')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {item.product_name}
                          </Typography>
                          {item.variant_name && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {item.variant_name}
                            </Typography>
                          )}
                          {item.sku && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {t('orders.detailsCard.table.values.sku')}: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell align='right'>{item.quantity}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {t('orders.detailsCard.summary.subtotal')}:
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {formatCurrency(subtotal)}
                        </Typography>
                      </Box>
                      {shippingCost > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.shipping')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatCurrency(shippingCost)}
                          </Typography>
                        </Box>
                      )}
                      {tax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.tax')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatCurrency(tax)}
                          </Typography>
                        </Box>
                      )}
                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.discount')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            -{formatCurrency(discount)}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                          {t('orders.detailsCard.summary.total')}:
                        </Typography>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                          {formatCurrency(total)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderDetailsCard
