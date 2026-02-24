'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import { useCart } from '@/contexts/CartContext'
import AddToCartModal from './AddToCartModal'

type Product = {
  id: number
  name: string
  brand: string
  price: number
  originalPrice: number | null
  discount: number | null
  rating: number
  reviews: number
  reference: string
  condition: string
  stock: number
  sizes: string[]
  colors: { name: string; value: string }[]
  images?: string[]
}

type ProductInfoFormProps = {
  product: Product
}

const ProductInfoForm = ({ product }: ProductInfoFormProps) => {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || '')
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || '')
  const [quantity, setQuantity] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta))
  }

  const handleAddToCart = () => {
    // Only require size/color selection if the product has those options
    const hasSizes = product.sizes.length > 0
    const hasColors = product.colors.length > 0

    if ((hasSizes && !selectedSize) || (hasColors && !selectedColor)) {
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images?.[0] || '',
      size: selectedSize || '',
      color: selectedColor || '',
      quantity
    })
    setModalOpen(true)
  }

  return (
    <Box>
      {/* Product Title */}
      <Typography variant='h4' className='font-bold mbe-2'>
        {product.name}
      </Typography>

      {/* Rating and Reviews */}
      <Box className='flex items-center gap-2 mbe-4'>
        <Rating value={product.rating} precision={0.5} size='small' readOnly />
        <Typography variant='body2' className='text-textSecondary'>
          {product.reviews} Review{product.reviews !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Product Info */}
      <Box className='flex flex-col gap-2 mbe-4'>
        <Typography variant='body2'>
          <span className='font-semibold'>Brand :</span> {product.brand}
        </Typography>
        <Typography variant='body2'>
          <span className='font-semibold'>Reference :</span> {product.reference}
        </Typography>
        <Typography variant='body2'>
          <span className='font-semibold'>Condition :</span> {product.condition}
        </Typography>
      </Box>

      <Divider className='mbe-4' />

      {/* Description */}
      <Typography variant='body2' className='text-textSecondary mbe-6'>
        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque
        corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in
        culpa.
      </Typography>

      {/* Size Selection */}
      {product.sizes.length > 0 && (
        <Box className='mbe-4'>
          <Typography variant='body2' className='font-semibold mbe-2'>
            Size : {selectedSize || 'Please select'}
          </Typography>
          <Box className='flex gap-2 flex-wrap'>
            {product.sizes.map(size => (
              <Chip
                key={size}
                label={size}
                onClick={() => setSelectedSize(size)}
                className={classnames('cursor-pointer', selectedSize === size && 'bg-primary text-white')}
                variant={selectedSize === size ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Color Selection */}
      {product.colors.length > 0 && (
        <Box className='mbe-4'>
          <Typography variant='body2' className='font-semibold mbe-2'>
            Color : {selectedColor || 'Please select'}
          </Typography>
          <Box className='flex gap-2 flex-wrap'>
            {product.colors.map(color => (
              <Box
                key={color.name}
                className={classnames(
                  'w-10 h-10 rounded-full border-2 cursor-pointer transition-all',
                  selectedColor === color.name ? 'border-primary scale-110' : 'border-gray-300 hover:border-gray-400'
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.name)}
                title={color.name}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Stock Alert */}
      {product.stock > 0 && product.stock < 100 && (
        <Box className='bg-warning/10 border border-warning/30 rounded p-3 mbe-4'>
          <Typography variant='body2' className='font-semibold text-warning'>
            Hurry! only <strong>{product.stock}</strong> items left in stock.
          </Typography>
        </Box>
      )}

      {/* Price */}
      <Box className='mbe-4'>
        <Typography variant='h4' className='font-bold text-primary'>
          ${product.price.toFixed(2)}
        </Typography>
        {product.originalPrice && (
          <Typography variant='body2' className='text-textSecondary line-through'>
            Regular price ${product.originalPrice.toFixed(2)}
          </Typography>
        )}
      </Box>

      {/* Delivery Info */}
      <Typography variant='body2' className='text-textSecondary mbe-6'>
        Delivered within 2-3 days
      </Typography>

      {/* Quantity and Add to Cart */}
      <Box className='flex flex-col gap-4 mbe-6'>
        <Box className='flex items-center gap-4'>
          <Typography variant='body2' className='font-semibold'>
            Quantity
          </Typography>
          <Box className='flex items-center gap-2 border rounded'>
            <IconButton size='small' onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
              <i className='tabler-minus' />
            </IconButton>
            <TextField
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ style: { textAlign: 'center', width: '60px' } }}
              variant='standard'
              sx={{
                '& .MuiInput-underline:before': { display: 'none' },
                '& .MuiInput-underline:after': { display: 'none' }
              }}
            />
            <IconButton size='small' onClick={() => handleQuantityChange(1)}>
              <i className='tabler-plus' />
            </IconButton>
          </Box>
        </Box>

        <Button
          variant='contained'
          color='primary'
          size='large'
          fullWidth
          startIcon={<i className='tabler-shopping-cart' />}
          onClick={handleAddToCart}
          disabled={(product.sizes.length > 0 && !selectedSize) || (product.colors.length > 0 && !selectedColor)}
        >
          Add to cart
        </Button>
      </Box>

      {/* Action Buttons */}
      <Box className='flex gap-4'>
        <Tooltip title='Add to Compare'>
          <IconButton className='border'>
            <i className='tabler-scale' />
          </IconButton>
        </Tooltip>
        <Tooltip title='Add to Wishlist'>
          <IconButton className='border'>
            <i className='tabler-heart' />
          </IconButton>
        </Tooltip>
        <Tooltip title='Share'>
          <IconButton className='border'>
            <i className='tabler-share' />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider className='mts-6 mbe-6' />

      {/* Security Policies */}
      <Box className='flex flex-col gap-2'>
        <Typography variant='body2' className='font-semibold'>
          Security policy
        </Typography>
        <Typography variant='body2' className='font-semibold'>
          Delivery policy
        </Typography>
        <Typography variant='body2' className='font-semibold'>
          Return policy
        </Typography>
        <Typography variant='body2' className='text-textSecondary mts-2'>
          (edit with the Customer Reassurance module)
        </Typography>
      </Box>

      <Box className='mts-4'>
        <Typography variant='body2' className='font-semibold'>
          Guarantee safe checkout
        </Typography>
      </Box>

      {/* Add to Cart Modal */}
      <AddToCartModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.images?.[0] || '',
          size: selectedSize,
          color: selectedColor,
          quantity
        }}
      />
    </Box>
  )
}

export default ProductInfoForm
