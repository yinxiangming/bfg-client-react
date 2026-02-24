'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

// Type Imports
import type { Product } from '@/services/store'

type ProductPricingProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const ProductPricing = ({ productData, onChange }: ProductPricingProps) => {
    const t = useTranslations('admin')
    const [price, setPrice] = useState(productData?.price || '')
    const [comparePrice, setComparePrice] = useState(productData?.compare_price ?? '')
    const [cost, setCost] = useState(productData?.cost ?? '')

    useEffect(() => {
        setPrice(productData?.price || '')
        setComparePrice(productData?.compare_price ?? '')
        setCost(productData?.cost ?? '')
    }, [productData?.price, productData?.compare_price, productData?.cost])

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(e.target.value)
        onChange?.('price', parseFloat(e.target.value) || 0)
    }

    const handleComparePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setComparePrice(e.target.value)
        onChange?.('compare_price' as keyof Product, e.target.value === '' ? null : parseFloat(e.target.value) || 0)
    }

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCost(e.target.value)
        onChange?.('cost' as keyof Product, e.target.value === '' ? null : parseFloat(e.target.value) || 0)
    }

    return (
        <Card>
            <CardHeader title={t('products.pricing.title')} />
            <CardContent className='flex flex-col gap-6'>
                <CustomTextField
                    fullWidth
                    label={t('products.pricing.fields.basePrice.label')}
                    placeholder={t('products.pricing.fields.basePrice.placeholder')}
                    type='number'
                    value={price}
                    onChange={handlePriceChange}
                />
                <CustomTextField
                    fullWidth
                    label={t('products.pricing.fields.discountedPrice.label')}
                    placeholder={t('products.pricing.fields.discountedPrice.placeholder')}
                    type='number'
                    value={comparePrice}
                    onChange={handleComparePriceChange}
                />
                <CustomTextField
                    fullWidth
                    label={t('products.pricing.fields.cost.label')}
                    placeholder={t('products.pricing.fields.cost.placeholder')}
                    type='number'
                    value={cost}
                    onChange={handleCostChange}
                />
            </CardContent>
        </Card>
    )
}

export default ProductPricing
