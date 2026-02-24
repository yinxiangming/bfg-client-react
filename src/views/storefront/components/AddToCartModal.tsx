'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

// Component Imports
import { useCart } from '@/contexts/CartContext'

// Util Imports
import { getStoreImageUrl } from '@/utils/media'

type AddToCartModalProps = {
  open: boolean
  onClose: () => void
  product: {
    id: number
    name: string
    brand: string
    price: number
    image: string
    size: string
    color: string
    quantity: number
  }
}

const AddToCartModal = ({ open, onClose, product }: AddToCartModalProps) => {
  const t = useTranslations('storefront')
  const { items, getSubtotal, getShipping, getTotalWithShipping, getItemCount } = useCart()

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent className='p-6'>
        <Box className='flex justify-between items-center mbe-4'>
          <Box className='flex items-center gap-2'>
            <Box className='w-8 h-8 rounded-full bg-success flex items-center justify-center'>
              <i className='tabler-check text-white text-lg' />
            </Box>
            <Typography variant='h6' className='font-semibold'>
              {t('modal.addedTitle')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>

        <Divider className='mbe-4' />

        <Grid container spacing={4}>
          {/* Left: Product Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className='flex gap-4'>
              <Box
                component='img'
                src={product.image}
                alt={product.name}
                sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1 }}
              />
              <Box className='flex-1'>
                <Typography variant='h6' className='font-semibold mbe-2'>
                  {product.brand} {product.name}
                </Typography>
                <Typography variant='body1' className='font-bold text-primary mbe-2'>
                  ${product.price.toFixed(2)}
                </Typography>
                <Typography variant='body2' className='text-textSecondary mbe-1'>
                  {t('modal.size')} {product.size}
                </Typography>
                <Typography variant='body2' className='text-textSecondary mbe-1'>
                  {t('modal.color')} {product.color}
                </Typography>
                <Typography variant='body2' className='text-textSecondary'>
                  {t('modal.quantity')} {product.quantity}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right: Cart Summary */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className='border rounded p-4'>
              <Typography variant='h6' className='font-semibold mbe-4'>
                {t('modal.cartItemsCount', { count: getItemCount() })}
              </Typography>
              <Box className='flex flex-col gap-2 mbe-4'>
                <Box className='flex justify-between'>
                  <Typography variant='body2'>{t('modal.subtotal')}</Typography>
                  <Typography variant='body2' className='font-semibold'>
                    ${getSubtotal().toFixed(2)}
                  </Typography>
                </Box>
                <Box className='flex justify-between'>
                  <Typography variant='body2'>{t('modal.shipping')}</Typography>
                  <Typography variant='body2' className='font-semibold'>
                    ${getShipping().toFixed(2)}
                  </Typography>
                </Box>
                <Divider />
                <Box className='flex justify-between'>
                  <Typography variant='body2'>{t('modal.totalTaxExcl')}</Typography>
                  <Typography variant='body2' className='font-semibold'>
                    ${getTotalWithShipping().toFixed(2)}
                  </Typography>
                </Box>
                <Box className='flex justify-between'>
                  <Typography variant='body2'>{t('modal.totalTaxIncl')}</Typography>
                  <Typography variant='body2' className='font-semibold'>
                    ${getTotalWithShipping().toFixed(2)}
                  </Typography>
                </Box>
                <Box className='flex justify-between'>
                  <Typography variant='body2'>{t('modal.taxes')}</Typography>
                  <Typography variant='body2' className='font-semibold'>
                    $0.00
                  </Typography>
                </Box>
              </Box>
              <Box className='flex gap-2'>
                <Button variant='outlined' fullWidth component={Link} href='/cart' onClick={onClose}>
                  {t('modal.viewCart')}
                </Button>
                <Button variant='contained' fullWidth component={Link} href='/checkout' onClick={onClose}>
                  {t('modal.checkout')}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

export default AddToCartModal

