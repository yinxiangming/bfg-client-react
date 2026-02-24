'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Util Imports
import { getStoreImageUrl } from '@/utils/media'

const CategorySidebar = () => {
  // Sample data
  const leftBanner = {
    title: 'New trending',
    subtitle: 'Flats Upto 60% Off',
    image: getStoreImageUrl('modules/cp_cmsbanner4/views/img/cms-banner1.webp'),
    link: '/category/shoes'
  }

  const newProducts = [
    {
      id: 17,
      name: "Men's corduroy vintage polo shirts",
      brand: 'Urban',
      price: 58.65,
      originalPrice: 69.0,
      discount: 15,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('208-home_default/men-s-corduroy-vintage-polo-shirts.jpg'),
      isNew: true
    },
    {
      id: 18,
      name: 'Women short sleeve silk t-shirt',
      brand: 'Travel',
      price: 45.0,
      originalPrice: null,
      discount: null,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('203-home_default/women-short-sleeve-silk-t-shirt.jpg'),
      isNew: true
    },
    {
      id: 19,
      name: 'Nation girls fashion flare jeggings',
      brand: 'Smile',
      price: 89.0,
      originalPrice: null,
      discount: null,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('200-home_default/nation-girls-fashion-flare-jeggings.jpg'),
      isNew: true
    }
  ]

  const mostViewedProducts = [
    {
      id: 1,
      name: "Nike men's air force 1",
      brand: 'Barbie',
      price: 23.9,
      originalPrice: null,
      discount: null,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('25-home_default/nike-men-s-air-force-1.jpg'),
      isNew: true
    },
    {
      id: 2,
      name: 'Daniel wellington oxford watch',
      brand: 'George',
      price: 64.0,
      originalPrice: 80.0,
      discount: 20,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('125-home_default/daniel-wellington-oxford-watch.jpg'),
      isNew: true
    },
    {
      id: 3,
      name: "Boundaries women's tote bag",
      brand: 'Barbie',
      price: 40.5,
      originalPrice: 45.0,
      discount: 10,
      rating: 4.5,
      reviews: 1,
      image: getStoreImageUrl('129-home_default/boundaries-women-s-tote-bag.jpg'),
      isNew: true
    }
  ]

  return (
    <Box className='flex flex-col gap-4'>
      {/* Left Banner */}
      <Card className='relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow'>
        <CardMedia
          component='img'
          height='200'
          image={leftBanner.image}
          alt={leftBanner.title}
          className='object-cover'
        />
        <Box className='absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center'>
          <Typography variant='h6' className='text-white font-semibold mbe-2'>
            {leftBanner.title}
          </Typography>
          <Typography variant='body2' className='text-white mbe-4'>
            {leftBanner.subtitle}
          </Typography>
          <Button
            variant='contained'
            size='small'
            component={Link}
            href={leftBanner.link}
            className='bg-white text-primary hover:bg-gray-100'
          >
            Shop Now
          </Button>
        </Box>
      </Card>

      {/* New Products */}
      <Card>
        <CardContent>
          <Box className='flex justify-between items-center mbe-4'>
            <Typography variant='h6' className='font-semibold'>
              New products
            </Typography>
            <Button size='small' variant='text' component={Link} href='/new-products'>
              All products
            </Button>
          </Box>
          <Box className='flex flex-col gap-4'>
            {newProducts.map(product => (
              <Box key={product.id} className='flex gap-3'>
                <Box
                  component='img'
                  src={product.image}
                  alt={product.name}
                  sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
                />
                <Box className='flex-1'>
                  <Link href={`/product/${product.id}`} className='no-underline'>
                    <Typography variant='body2' className='font-medium hover:text-primary line-clamp-2 mbe-1'>
                      {product.brand} {product.name}
                    </Typography>
                  </Link>
                  <Box className='flex items-center gap-2'>
                    <Typography variant='body2' className='font-bold text-primary'>
                      ${product.price.toFixed(2)}
                    </Typography>
                    {product.originalPrice && (
                      <Typography variant='caption' className='text-textSecondary line-through'>
                        ${product.originalPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Most Viewed Products */}
      <Card>
        <CardContent>
          <Box className='flex justify-between items-center mbe-4'>
            <Typography variant='h6' className='font-semibold'>
              Most View Product
            </Typography>
            <Button size='small' variant='text' component={Link} href='/best-sellers'>
              All products
            </Button>
          </Box>
          <Box className='flex flex-col gap-4'>
            {mostViewedProducts.map(product => (
              <Box key={product.id} className='flex gap-3'>
                <Box
                  component='img'
                  src={product.image}
                  alt={product.name}
                  sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
                />
                <Box className='flex-1'>
                  <Link href={`/product/${product.id}`} className='no-underline'>
                    <Typography variant='body2' className='font-medium hover:text-primary line-clamp-2 mbe-1'>
                      {product.brand} {product.name}
                    </Typography>
                  </Link>
                  <Box className='flex items-center gap-2'>
                    <Typography variant='body2' className='font-bold text-primary'>
                      ${product.price.toFixed(2)}
                    </Typography>
                    {product.originalPrice && (
                      <Typography variant='caption' className='text-textSecondary line-through'>
                        ${product.originalPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CategorySidebar
