'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

// Type Imports
import type { Product } from '@/services/store'

type ProductInformationProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const CONDITION_VALUES = ['new', 'like_new', 'good', 'fair', 'poor'] as const

const ProductInformation = ({ productData, onChange }: ProductInformationProps) => {
    const t = useTranslations('admin')
    const [name, setName] = useState(productData?.name || '')
    const [slug, setSlug] = useState(productData?.slug || '')
    const [sku, setSku] = useState(productData?.sku || '')
    const [barcode, setBarcode] = useState((productData as any)?.barcode || '')
    const [condition, setCondition] = useState((productData as any)?.condition || '')

    // Sync with productData changes
    useEffect(() => {
        setName(productData?.name || '')
        setSlug(productData?.slug || '')
        setSku(productData?.sku || '')
        setBarcode((productData as any)?.barcode || '')
        setCondition((productData as any)?.condition || '')
    }, [productData?.name, productData?.slug, productData?.sku, (productData as any)?.barcode, (productData as any)?.condition])

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
        onChange?.('name', e.target.value)
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value)
        onChange?.('slug', e.target.value)
    }

    const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSku(e.target.value)
        onChange?.('sku', e.target.value)
    }

    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBarcode(e.target.value)
        // @ts-ignore - barcode might not be in Product type but we send it anyway
        onChange?.('barcode' as keyof Product, e.target.value)
    }

    const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCondition(value)
        onChange?.('condition' as keyof Product, value)
    }

    return (
        <Card>
            <CardHeader title={t('products.information.title')} />
            <CardContent>
                <Grid container spacing={6}>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            fullWidth
                            label={t('products.information.fields.name.label')}
                            placeholder={t('products.information.fields.name.placeholder')}
                            value={name}
                            onChange={handleNameChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            fullWidth
                            label={t('products.information.fields.slug.label')}
                            placeholder={t('products.information.fields.slug.placeholder')}
                            value={slug}
                            onChange={handleSlugChange}
                            helperText={t('products.information.fields.slug.helper')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            label={t('products.information.fields.sku.label')}
                            placeholder={t('products.information.fields.sku.placeholder')}
                            value={sku}
                            onChange={handleSkuChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            label={t('products.information.fields.barcode.label')}
                            placeholder={t('products.information.fields.barcode.placeholder')}
                            value={barcode}
                            onChange={handleBarcodeChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            select
                            label={t('products.information.fields.condition.label')}
                            value={condition}
                            onChange={handleConditionChange}
                            SelectProps={{ displayEmpty: true, renderValue: v => v ? t(`products.information.fields.condition.options.${v}` as any) : '' }}
                        >
                            <MenuItem value="">{t('products.information.fields.condition.placeholder')}</MenuItem>
                            {CONDITION_VALUES.map(c => (
                                <MenuItem key={c} value={c}>{t(`products.information.fields.condition.options.${c}` as any)}</MenuItem>
                            ))}
                        </CustomTextField>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default ProductInformation
