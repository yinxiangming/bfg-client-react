'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Avatar from '@mui/material/Avatar'
import LinkMui from '@mui/material/Link'

// Services & Types
import { getResaleProducts } from '../../services'
import type { ResaleProduct, ResaleProductStatus } from '../../types'

const statusColors: Record<ResaleProductStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  active: 'primary',
  sold: 'success',
  returned: 'warning',
  expired: 'error'
}

const ResaleProductsPage = () => {
  const t = useTranslations('resale')
  const [products, setProducts] = useState<ResaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ResaleProductStatus | ''>('')

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = statusFilter ? { status: statusFilter } : undefined
      const response = await getResaleProducts(params)
      const list = Array.isArray(response) ? response : (response.results ?? [])
      setProducts(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadProductsAdmin'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [statusFilter])

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
    <Card>
      <CardHeader
        title={t('admin.products.title')}
        subheader={t('admin.products.subtitle')}
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('admin.payouts.statusLabel')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('admin.payouts.statusLabel')}
              onChange={(e) => setStatusFilter(e.target.value as ResaleProductStatus | '')}
            >
              <MenuItem value="">{t('admin.payouts.all')}</MenuItem>
              <MenuItem value="pending">{t('status.product.pending')}</MenuItem>
              <MenuItem value="active">{t('status.product.active')}</MenuItem>
              <MenuItem value="sold">{t('status.product.sold')}</MenuItem>
              <MenuItem value="returned">{t('status.product.returned')}</MenuItem>
              <MenuItem value="expired">{t('status.product.expired')}</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : products.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            {t('errors.noResaleProductsFound')}
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.products.table.product')}</TableCell>
                  <TableCell>{t('admin.products.table.customer')}</TableCell>
                  <TableCell>{t('admin.products.table.stock')}</TableCell>
                  <TableCell>{t('admin.products.table.price')}</TableCell>
                  <TableCell>{t('admin.products.table.commission')}</TableCell>
                  <TableCell>{t('admin.products.table.status')}</TableCell>
                  <TableCell>{t('admin.products.table.listed')}</TableCell>
                  <TableCell>{t('admin.products.table.expires')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <LinkMui
                        component={Link}
                        href={`/admin/store/products/${product.product}/edit`}
                        color="primary"
                        underline="hover"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1.5,
                          textDecoration: 'none'
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          src={product.product_image ?? undefined}
                          alt=""
                          sx={{ width: 40, height: 40, bgcolor: 'action.hover' }}
                        />
                        <Typography variant="body2" fontWeight={500} component="span">
                          {product.product_name ?? t('productId', { id: product.product })}
                        </Typography>
                      </LinkMui>
                    </TableCell>
                    <TableCell>
                      <LinkMui
                        component={Link}
                        href={`/admin/store/customers/${product.customer}`}
                        color="primary"
                        underline="hover"
                      >
                        {product.customer_name ?? t('customerId', { id: product.customer })}
                      </LinkMui>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.stock_quantity ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatMoney(product.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.commission_rate}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          product.status === 'sold' && product.sold_quantity != null
                            ? t('admin.products.soldCount', { count: product.sold_quantity })
                            : t(`status.product.${product.status}`)
                        }
                        size="small"
                        color={statusColors[product.status]}
                      />
                    </TableCell>
                    <TableCell>{formatDate(product.listing_start_date)}</TableCell>
                    <TableCell>{formatDate(product.listing_end_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default ResaleProductsPage
