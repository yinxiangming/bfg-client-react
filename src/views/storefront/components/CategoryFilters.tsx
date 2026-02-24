'use client'

// React Imports
import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Slider from '@mui/material/Slider'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

type CategoryFiltersProps = {
  selectedSizes: string[]
  setSelectedSizes: (sizes: string[]) => void
  selectedColors: string[]
  setSelectedColors: (colors: string[]) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
}

const CategoryFilters = ({
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  priceRange,
  setPriceRange
}: CategoryFiltersProps) => {
  const t = useTranslations('storefront')
  const sizes = ['S', 'M', 'L', 'XL']
  const sizeCounts: Record<string, number> = { S: 14, M: 15, L: 15, XL: 5 }

  const colors = [
    { name: 'Gray', count: 8 },
    { name: 'Taupe', count: 2 },
    { name: 'Beige', count: 2 },
    { name: 'Off White', count: 6 },
    { name: 'Red', count: 2 },
    { name: 'Black', count: 9 },
    { name: 'Camel', count: 8 },
    { name: 'Orange', count: 4 },
    { name: 'Blue', count: 4 },
    { name: 'Green', count: 1 },
    { name: 'Yellow', count: 3 },
    { name: 'Brown', count: 8 },
    { name: 'Pink', count: 1 }
  ]

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size))
    } else {
      setSelectedSizes([...selectedSizes, size])
    }
  }

  const handleColorToggle = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color))
    } else {
      setSelectedColors([...selectedColors, color])
    }
  }

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number])
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' className='font-semibold mbe-4'>
          {t('filters.title')}
        </Typography>

        {/* Size Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
            <Typography variant='subtitle2' className='font-medium'>
              {t('filters.size')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className='flex flex-col gap-2'>
              {sizes.map(size => (
                <FormControlLabel
                  key={size}
                  control={
                    <Checkbox
                      checked={selectedSizes.includes(size)}
                      onChange={() => handleSizeToggle(size)}
                      size='small'
                    />
                  }
                  label={
                    <Box className='flex justify-between items-center' sx={{ width: '100%' }}>
                      <Typography variant='body2'>{size}</Typography>
                      <Typography variant='body2' className='text-textSecondary'>
                        ({sizeCounts[size]})
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Color Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
            <Typography variant='subtitle2' className='font-medium'>
              {t('filters.color')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className='flex flex-col gap-2'>
              {colors.map(color => (
                <FormControlLabel
                  key={color.name}
                  control={
                    <Checkbox
                      checked={selectedColors.includes(color.name)}
                      onChange={() => handleColorToggle(color.name)}
                      size='small'
                    />
                  }
                  label={
                    <Box className='flex justify-between items-center' sx={{ width: '100%' }}>
                      <Typography variant='body2'>{color.name}</Typography>
                      <Typography variant='body2' className='text-textSecondary'>
                        ({color.count})
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Price Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='tabler-chevron-down' />}>
            <Typography variant='subtitle2' className='font-medium'>
              {t('filters.price')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                min={15}
                max={89}
                valueLabelDisplay='auto'
                valueLabelFormat={value => `$${value}`}
                sx={{ mbe: 2 }}
              />
              <Box className='flex justify-between items-center'>
                <Typography variant='body2'>${priceRange[0]}</Typography>
                <Typography variant='body2'>${priceRange[1]}</Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default CategoryFilters
