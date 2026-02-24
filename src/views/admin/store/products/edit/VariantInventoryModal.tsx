'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Type Imports
import type { Product, ProductVariant, Warehouse } from '@/services/store'
import { getProductVariants, getWarehouses, getVariantInventories, updateVariantInventories, type VariantInventory } from '@/services/store'

type VariantInventoryModalProps = {
    open: boolean
    onClose: () => void
    productId: number
    productData?: Partial<Product>
    variantId?: number  // Optional: filter to show only this variant's inventory
    onUpdate?: () => void
}

const VariantInventoryModal = ({ open, onClose, productId, productData, variantId, onUpdate }: VariantInventoryModalProps) => {
    const t = useTranslations('admin')
    const [variants, setVariants] = useState<ProductVariant[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [inventories, setInventories] = useState<Record<string, VariantInventory>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load variants and warehouses
    useEffect(() => {
        if (open && productId) {
            loadData()
        }
    }, [open, productId, variantId])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const [variantsData, warehousesData] = await Promise.all([
                getProductVariants(productId),
                getWarehouses()
            ])
            
            // Filter variants if variantId is provided
            const filteredVariants = variantId 
                ? (variantsData || []).filter(v => v.id === variantId)
                : (variantsData || [])
            
            setVariants(filteredVariants)
            setWarehouses(warehousesData || [])
            
            // Load existing inventories
            await loadInventories(filteredVariants, warehousesData || [])
        } catch (err: any) {
            console.error('Failed to load inventory data:', err)
            setError(err.message || t('products.variantInventory.errors.loadFailed'))
        } finally {
            setLoading(false)
        }
    }

    const loadInventories = async (variantsList: ProductVariant[], warehousesList: Warehouse[]) => {
        try {
            // Load existing inventories from API
            const existingInventories = await getVariantInventories(productId)
            
            // Initialize inventory map with default values
            const inventoryMap: Record<string, VariantInventory> = {}
            
            variantsList.forEach(variant => {
                warehousesList.forEach(warehouse => {
                    const key = `${variant.id}-${warehouse.id}`
                    // Find existing inventory for this variant-warehouse combination
                    const existingInventory = existingInventories.find(
                        inv => inv.variant === variant.id && inv.warehouse === warehouse.id
                    )
                    
                    inventoryMap[key] = {
                        id: existingInventory?.id,
                        variant: variant.id,
                        warehouse: warehouse.id,
                        quantity: existingInventory?.quantity || 0,
                        reserved: existingInventory?.reserved || 0
                    }
                })
            })
            
            setInventories(inventoryMap)
        } catch (err) {
            console.error('Failed to load inventories:', err)
            // Initialize with default values if API fails
            const inventoryMap: Record<string, VariantInventory> = {}
            variantsList.forEach(variant => {
                warehousesList.forEach(warehouse => {
                    const key = `${variant.id}-${warehouse.id}`
                    inventoryMap[key] = {
                        variant: variant.id,
                        warehouse: warehouse.id,
                        quantity: 0,
                        reserved: 0
                    }
                })
            })
            setInventories(inventoryMap)
        }
    }

    const handleQuantityChange = (variantId: number, warehouseId: number, value: string) => {
        const key = `${variantId}-${warehouseId}`
        const quantity = parseInt(value) || 0
        
        setInventories(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                quantity: Math.max(0, quantity)
            }
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            
            // Prepare inventory updates
            const updates = Object.values(inventories).map(inv => ({
                variant: inv.variant,
                warehouse: inv.warehouse,
                quantity: inv.quantity
            }))
            
            // Call API to update inventories
            await updateVariantInventories(productId, updates)
            
            onUpdate?.()
            onClose()
        } catch (err: any) {
            console.error('Failed to save inventory:', err)
            setError(err.message || t('products.variantInventory.errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    const getInventoryKey = (variantId: number, warehouseId: number) => {
        return `${variantId}-${warehouseId}`
    }

    const getTotalForVariant = (variantId: number) => {
        return warehouses.reduce((sum, warehouse) => {
            const key = getInventoryKey(variantId, warehouse.id)
            return sum + (inventories[key]?.quantity || 0)
        }, 0)
    }

    const getTotalForWarehouse = (warehouseId: number) => {
        return variants.reduce((sum, variant) => {
            const key = getInventoryKey(variant.id, warehouseId)
            return sum + (inventories[key]?.quantity || 0)
        }, 0)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
            <DialogTitle>
                {variantId
                    ? t('products.variantInventory.titleWithVariant', {
                          variant:
                              variants.find(v => v.id === variantId)?.name ||
                              variants.find(v => v.id === variantId)?.sku ||
                              t('products.variantInventory.variantFallback')
                      })
                    : t('products.variantInventory.title')}
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
                ) : variants.length === 0 ? (
                    <Typography color='text.secondary' sx={{ p: 2 }}>
                        {variantId ? t('products.variantInventory.empty.variantNotFound') : t('products.variantInventory.empty.noVariants')}
                    </Typography>
                ) : warehouses.length === 0 ? (
                    <Typography color='text.secondary' sx={{ p: 2 }}>
                        {t('products.variantInventory.empty.noWarehouses')}
                    </Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size='small'>
                            <TableHead>
                                <TableRow>
                                    {!variantId && <TableCell>{t('products.variantInventory.table.headers.variant')}</TableCell>}
                                    {warehouses.map(warehouse => (
                                        <TableCell key={warehouse.id} align='right'>
                                            {warehouse.name}
                                        </TableCell>
                                    ))}
                                    <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                        {t('products.variantInventory.table.headers.total')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {variants.map(variant => (
                                    <TableRow key={variant.id}>
                                        {!variantId && (
                                            <TableCell>
                                                <Typography variant='body2' fontWeight='medium'>
                                                    {variant.name || variant.sku || t('products.variantInventory.variantWithId', { id: variant.id })}
                                                </Typography>
                                            </TableCell>
                                        )}
                                        {warehouses.map(warehouse => {
                                            const key = getInventoryKey(variant.id, warehouse.id)
                                            const inventory = inventories[key]
                                            return (
                                                <TableCell key={warehouse.id} align='right'>
                                                    <TextField
                                                        type='number'
                                                        size='small'
                                                        value={inventory?.quantity || 0}
                                                        onChange={(e) => handleQuantityChange(variant.id, warehouse.id, e.target.value)}
                                                        inputProps={{
                                                            min: 0,
                                                            style: { textAlign: 'right', width: '80px' }
                                                        }}
                                                    />
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                            {getTotalForVariant(variant.id)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!variantId && (
                                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{t('products.variantInventory.table.headers.total')}</TableCell>
                                        {warehouses.map(warehouse => (
                                            <TableCell key={warehouse.id} align='right' sx={{ fontWeight: 'bold' }}>
                                                {getTotalForWarehouse(warehouse.id)}
                                            </TableCell>
                                        ))}
                                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                            {Object.values(inventories).reduce((sum, inv) => sum + (inv.quantity || 0), 0)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t('products.variantInventory.actions.cancel')}
                </Button>
                <Button onClick={handleSave} variant='contained' disabled={saving || loading}>
                    {saving ? <CircularProgress size={20} /> : t('products.variantInventory.actions.save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default VariantInventoryModal
