'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { useCart } from '@/contexts/CartContext'

type Product = {
  id: number
  name: string
  brand: string
  price: number
  originalPrice: number | null
  discount: number | null
  rating: number
  reviews: number
  image: string
  isNew: boolean
  description?: string
}

const ProductListView = ({ product }: { product: Product }) => {
  const t = useTranslations('storefront')
  const [isHovered, setIsHovered] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const { addItem, loading } = useCart()

  const handleAddToCart = async () => {
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        size: '',
        color: '',
        quantity: 1
      })
      setSnackbarMessage(t('product.alerts.addedToCart'))
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to add product to cart:', err)
      // Extract more detailed error message
      let errorMessage = t('product.alerts.addFailed')
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage
      } else if (err?.data) {
        // Try different error message fields
        errorMessage = err.data.detail || err.data.message || err.data.error || errorMessage
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      // Add status code if available
      if (err?.status) {
        const statusText = err.statusText || ''
        if (statusText) {
          errorMessage = `${errorMessage} (${err.status} ${statusText})`
        } else {
          errorMessage = `${errorMessage} (Status: ${err.status})`
        }
      }
      
      // Fallback if error message is still generic
      if (errorMessage === t('product.alerts.addFailed') && err?.status) {
        errorMessage = `Request failed with status ${err.status}`
      }
      
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  return (
    <Card
      className='mbe-4 hover:shadow-lg transition-all duration-300'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <Box className='relative'>
            <CardMedia
              component='img'
              height='200'
              image={product.image}
              alt={product.name}
              className='object-cover'
            />
            {product.isNew && (
              <Chip
                label={t('product.badges.new')}
                color='primary'
                size='small'
                className='absolute top-2 left-2'
                sx={{ fontWeight: 600 }}
              />
            )}
            {product.discount && (
              <Chip
                label={`-${product.discount}%`}
                color='error'
                size='small'
                className='absolute top-2 left-2'
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 8, md: 9 }}>
          <CardContent>
            <Box className='flex justify-between items-start mbe-2'>
              <Box className='flex-1'>
                <Link href={`/product/${product.id}`} className='no-underline'>
                  <Typography variant='h5' className='font-semibold mbe-2 hover:text-primary'>
                    {product.brand} {product.name}
                  </Typography>
                </Link>
                <Box className='flex items-center gap-1 mbe-2'>
                  <Rating value={product.rating} precision={0.5} size='small' readOnly />
                  <Typography variant='body2' className='text-textSecondary'>
                    ({product.reviews} Review{product.reviews !== 1 ? 's' : ''})
                  </Typography>
                </Box>
                {product.description && (
                  <Typography variant='body2' className='text-textSecondary mbe-3 line-clamp-2'>
                    {product.description}
                  </Typography>
                )}
              </Box>
              <Box
                className={classnames(
                  'flex flex-col gap-2 transition-opacity duration-300',
                  isHovered ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Tooltip title={t('product.actions.addToWishlist')}>
                  <IconButton size='small' className='bg-gray-100 hover:bg-gray-200'>
                    <i className='tabler-heart text-textPrimary' />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('product.actions.addToCompare')}>
                  <IconButton size='small' className='bg-gray-100 hover:bg-gray-200'>
                    <i className='tabler-scale text-textPrimary' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box className='flex justify-between items-center'>
              <Box className='flex items-center gap-2'>
                <Typography variant='h5' className='font-bold text-primary'>
                  ${product.price.toFixed(2)}
                </Typography>
                {product.originalPrice && (
                  <Typography variant='body2' className='text-textSecondary line-through'>
                    ${product.originalPrice.toFixed(2)}
                  </Typography>
                )}
              </Box>
              <Button
                variant='contained'
                className={classnames('transition-all', isHovered ? 'opacity-100' : 'opacity-0')}
                startIcon={<i className='tabler-shopping-cart' />}
                onClick={handleAddToCart}
                disabled={loading}
              >
                {t('buttons.addToCart')}
              </Button>
            </Box>
          </CardContent>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default ProductListView

