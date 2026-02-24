'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'

// Third-party Imports
import classnames from 'classnames'

type ProductImageGalleryProps = {
  images: string[]
  productName: string
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handlePrevious = () => {
    setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setSelectedImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <Box>
      {/* Main Image */}
      <Card className='relative overflow-hidden mbe-4'>
        <CardMedia
          component='img'
          image={images[selectedImageIndex]}
          alt={productName}
          sx={{ width: '100%', height: 'auto', aspectRatio: '1', objectFit: 'cover' }}
        />
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              className='absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white'
              onClick={handlePrevious}
              size='small'
            >
              <i className='tabler-chevron-left' />
            </IconButton>
            <IconButton
              className='absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white'
              onClick={handleNext}
              size='small'
            >
              <i className='tabler-chevron-right' />
            </IconButton>
          </>
        )}
      </Card>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <Box className='flex gap-2 overflow-x-auto'>
          {images.map((image, index) => (
            <Card
              key={index}
              className={classnames(
                'cursor-pointer border-2 transition-all shrink-0',
                selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
              )}
              onClick={() => setSelectedImageIndex(index)}
              sx={{ width: 80, height: 80 }}
            >
              <CardMedia
                component='img'
                image={image}
                alt={`${productName} ${index + 1}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default ProductImageGallery
