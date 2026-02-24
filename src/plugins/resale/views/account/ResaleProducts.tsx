'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'

// Services & Types
import { getMyResaleProducts } from '../../services'
import type { ResaleProduct, ResaleProductStatus } from '../../types'

const statusColors: Record<ResaleProductStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  active: 'primary',
  sold: 'success',
  returned: 'warning',
  expired: 'error'
}

const ResaleProducts = () => {
  const t = useTranslations('resale')
  const statusLabels: Record<ResaleProductStatus, string> = {
    pending: t('status.product.pending'),
    active: t('status.product.active'),
    sold: t('status.product.sold'),
    returned: t('status.product.returned'),
    expired: t('status.product.expired')
  }
  const [products, setProducts] = useState<ResaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyResaleProducts()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadProducts'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatMoney = (value?: string | null) => {
    if (value == null || value === '') return '-'
    const n = parseFloat(value)
    if (Number.isNaN(n)) return value
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card
          variant="outlined"
          sx={{
            boxShadow: 'none',
            borderRadius: 2
          }}
        >
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('myProducts.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('myProducts.subtitle')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('myProducts.empty')}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.item')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.price')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.commission')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.stock')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.status')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.listedDate')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myProducts.table.expires')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell sx={{ py: 1.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              variant="rounded"
                              src={product.product_image ?? undefined}
                              alt=""
                              sx={{ width: 48, height: 48, bgcolor: 'action.hover' }}
                            />
                            <Typography variant="body2" fontWeight={500}>
                              {product.product_name ?? t('productId', { id: product.product })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant="body2">
                            {formatMoney(product.price)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Box>
                            <Typography variant="body2" component="span">
                              {formatMoney(product.commission_amount)}
                            </Typography>
                            {product.commission_amount != null && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                ({product.commission_rate}%)
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant="body2">
                            {product.stock_quantity ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Chip
                            label={
                              product.status === 'sold' && product.sold_quantity != null
                                ? t('admin.products.soldCount', { count: product.sold_quantity })
                                : statusLabels[product.status]
                            }
                            color={statusColors[product.status]}
                            size="small"
                            sx={{ textTransform: 'capitalize', px: 1.25, fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(product.listing_start_date)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(product.listing_end_date)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ResaleProducts
