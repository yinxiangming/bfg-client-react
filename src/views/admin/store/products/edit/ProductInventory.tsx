'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/Info'
import Link from '@mui/material/Link'

// Component Imports
import VariantInventoryModal from './VariantInventoryModal'

// Type Imports
import type { Product } from '@/services/store'

type ProductInventoryProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const ProductInventory = ({ productData, onChange }: ProductInventoryProps) => {
    const t = useTranslations('admin')
    const [trackInventory, setTrackInventory] = useState(productData?.track_inventory ?? true)
    const [inventoryModalOpen, setInventoryModalOpen] = useState(false)

    useEffect(() => {
        setTrackInventory(productData?.track_inventory ?? true)
    }, [productData?.track_inventory])

    // Display calculated stock_quantity from backend (auto-calculated from VariantInventory)
    const totalStock = productData?.stock_quantity || 0

    const handleTrackInventoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTrackInventory(e.target.checked)
        onChange?.('track_inventory', e.target.checked)
    }

    return (
        <Card>
            <CardHeader
                title={t('products.inventory.title')}
                sx={{ pb: 0 }}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 1, pt: 0.5 }}>
                        {productData?.id && (
                            <Link
                                component='button'
                                variant='body2'
                                onClick={() => setInventoryModalOpen(true)}
                                sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                                {t('products.inventory.actions.manageInventory')}
                            </Link>
                        )}
                        <Typography variant='h5' fontWeight={600} lineHeight={1}>
                            {totalStock}
                        </Typography>
                    </Box>
                }
            />
            <CardContent sx={{ pt: 2, '&:last-child': { pb: 2 }, display: 'flex', flexDirection: 'column', gap: 0, '& > *': { mb: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{t('products.inventory.fields.trackInventory')}</Typography>
                            <Tooltip 
                                title={t('products.inventory.fields.trackInventoryHelp')}
                                arrow
                            >
                                <InfoIcon sx={{ fontSize: 18, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                        <Switch
                            checked={trackInventory}
                            onChange={handleTrackInventoryChange}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>{t('products.inventory.fields.requiresShipping')}</Typography>
                        <Switch defaultChecked />
                    </Box>
                </Box>
            </CardContent>
            
            {productData?.id && (
                <VariantInventoryModal
                    open={inventoryModalOpen}
                    onClose={() => setInventoryModalOpen(false)}
                    productId={productData.id}
                    productData={productData}
                    onUpdate={() => {
                        // Trigger parent to refresh product data
                        if (onChange) {
                            onChange('_refresh' as any, Date.now())
                        }
                    }}
                />
            )}
        </Card>
    )
}

export default ProductInventory
