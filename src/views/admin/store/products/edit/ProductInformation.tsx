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

// Component Imports
import CustomTextField from '@/components/ui/TextField'

// Type Imports
import type { Product } from '@/services/store'

type ProductInformationProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const ProductInformation = ({ productData, onChange }: ProductInformationProps) => {
    const t = useTranslations('admin')
    const [name, setName] = useState(productData?.name || '')
    const [sku, setSku] = useState(productData?.sku || '')
    const [barcode, setBarcode] = useState((productData as any)?.barcode || '')

    // Sync with productData changes
    useEffect(() => {
        setName(productData?.name || '')
        setSku(productData?.sku || '')
        setBarcode((productData as any)?.barcode || '')
    }, [productData?.name, productData?.sku, (productData as any)?.barcode])

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
        onChange?.('name', e.target.value)
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
                </Grid>
            </CardContent>
        </Card>
    )
}

export default ProductInformation
