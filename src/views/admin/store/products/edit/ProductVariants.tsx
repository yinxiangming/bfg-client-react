'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'

// API Imports
import { getProductVariants, createProductVariant, deleteProductVariant, uploadProductMedia, updateProductVariant, type ProductVariant, type ProductMedia } from '@/services/store'

// Component Imports
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog'
import VariantInventoryModal from './VariantInventoryModal'

type ProductVariantsProps = {
    productId: string
    productMedia?: ProductMedia[]
    initialVariants?: ProductVariant[]
}

type NewVariantData = Partial<ProductVariant> & {
    imageUrl?: string
    selectedMedia?: ProductMedia
}

const ProductVariants = ({ productId, productMedia, initialVariants }: ProductVariantsProps) => {
    const t = useTranslations('admin')
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants || [])
    const [variantImages, setVariantImages] = useState<Record<number, string>>({})
    const [newVariant, setNewVariant] = useState<NewVariantData | null>(null)
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
    const [mediaLibraryTarget, setMediaLibraryTarget] = useState<{ variantId: number | 'new' } | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'error' })
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name?: string } | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editDraft, setEditDraft] = useState<Partial<ProductVariant>>({})
    const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
    const [inventoryModalVariantId, setInventoryModalVariantId] = useState<number | undefined>(undefined)

    const productIdNumber = useMemo(() => {
        if (productId === 'new') return undefined
        return parseInt(productId)
    }, [productId])

    const fetchVariants = async () => {
        // Skip fetching for new products
        if (productIdNumber === undefined) {
            setVariants([])
            return
        }
        
        try {
            const data = await getProductVariants(productIdNumber)
            setVariants(data)
            // load first image per variant
            // initial images from product media prop
            // Merge with existing variantImages to preserve manually updated images
            setVariantImages(prev => {
                const mediaMap: Record<number, string> = { ...prev }
                productMedia?.forEach(m => {
                    if (m.variant) {
                        // Only update if not already set (preserve manual updates)
                        if (!mediaMap[m.variant]) {
                            mediaMap[m.variant] = m.file
                        }
                    }
                })
                return mediaMap
            })
        } catch (error) {
            console.error("Failed to fetch variants", error)
        }
    }

    useEffect(() => {
        if (productId && variants.length === 0 && productIdNumber !== undefined) {
            fetchVariants()
        }
    }, [productId, variants.length, productIdNumber])

    useEffect(() => {
        // Update images when productMedia prop changes
        // Merge with existing variantImages to preserve manually updated images
        setVariantImages(prev => {
            const mediaMap: Record<number, string> = { ...prev }
            productMedia?.forEach(m => {
                if (m.variant) {
                    // Only update if not already set (preserve manual updates)
                    if (!mediaMap[m.variant]) {
                        mediaMap[m.variant] = m.file
                    }
                }
            })
            return mediaMap
        })
    }, [productMedia])

    const handleCreate = async () => {
        if (!newVariant || productIdNumber === undefined) {
            setSnackbar({ open: true, message: t('products.variants.errors.saveProductFirst'), severity: 'error' })
            return
        }
        try {
            const created = await createProductVariant({
                name: newVariant.name,
                sku: newVariant.sku,
                product: productIdNumber,
                price: newVariant.price || 0,
                stock_quantity: newVariant.stock_quantity || 0,
                is_active: true
            })
            // If there's a selected image for the new variant, associate it
            const selectedMedia = (newVariant as any).selectedMedia as ProductMedia | undefined
            if (selectedMedia) {
                try {
                    const { copyProductMediaToProduct } = await import('@/services/store')
                    const { apiFetch } = await import('@/utils/api')
                    const { bfgApi } = await import('@/utils/api')
                    
                    // Get the underlying Media object ID
                    // selectedMedia is a ProductMedia from MediaLibraryDialog
                    const mediaId = selectedMedia.media?.id || selectedMedia.id
                    
                    if (!mediaId) {
                        throw new Error('Media ID not found')
                    }
                    
                    // Check if this media already belongs to the current product
                    const existingProductMedia = productMedia?.find(m => {
                        const mMediaId = m.media?.id || m.id
                        return mMediaId === mediaId && m.product === productIdNumber
                    })
                    
                    let targetMediaId = mediaId
                    
                    if (!existingProductMedia && productIdNumber !== undefined) {
                        // Media belongs to another product or is a generic Media object
                        // Copy it to this product first using the ProductMedia ID
                        const sourceProductMediaId = selectedMedia.id // This is the ProductMedia ID
                        const newProductMedia = await copyProductMediaToProduct(sourceProductMediaId, productIdNumber, false)
                        // Get the Media ID from the copied ProductMedia
                        targetMediaId = newProductMedia.media?.id || newProductMedia.id
                    }
                    
                    // Create a new ProductMedia record for this variant (allows multiple variants to share the same Media)
                    await apiFetch<ProductMedia>(bfgApi.productMedia(), {
                        method: 'POST',
                        body: JSON.stringify({
                            product: productIdNumber,
                            variant: created.id,
                            media_id: targetMediaId,
                            is_product_image: false
                        })
                    })
                    
                    setVariantImages(prev => ({ ...prev, [created.id]: selectedMedia.file }))
                } catch (mediaError) {
                    console.error('Failed to associate image with variant', mediaError)
                    // Don't fail the variant creation if image association fails
                }
            }
            setNewVariant(null)
            fetchVariants()
            setSnackbar({ open: true, message: t('products.variants.snackbar.created'), severity: 'success' })
        } catch (error) {
            console.error("Failed to create variant", error)
            const detail =
                (error as any)?.data?.non_field_errors?.[0] ||
                (error as any)?.message ||
                t('products.variants.errors.createFailed')
            setSnackbar({ open: true, message: detail, severity: 'error' })
        }
    }

    const handleSelectVariantMedia = async (media: ProductMedia) => {
        if (!mediaLibraryTarget) return
        
        if (mediaLibraryTarget.variantId === 'new') {
            // For new variant, store the image URL
            setNewVariant(prev => prev ? { ...prev, imageUrl: media.file, selectedMedia: media } : { imageUrl: media.file, selectedMedia: media })
            setMediaLibraryOpen(false)
            setMediaLibraryTarget(null)
        } else {
            // For existing variant, create or get ProductMedia association
            if (productIdNumber === undefined) {
                setSnackbar({ open: true, message: t('products.variants.errors.saveProductFirstImages'), severity: 'error' })
                setMediaLibraryOpen(false)
                setMediaLibraryTarget(null)
                return
            }
            
            const variantId = mediaLibraryTarget.variantId as number
            try {
                const { copyProductMediaToProduct } = await import('@/services/store')
                const { apiFetch } = await import('@/utils/api')
                const { bfgApi } = await import('@/utils/api')
                
                // Immediately update the UI with the selected image
                const imageUrl = media.file
                setVariantImages(prev => ({ ...prev, [variantId]: imageUrl }))
                
                // Get the underlying Media object ID
                // media is a ProductMedia from MediaLibraryDialog
                // The media field can be either:
                // 1. A nested object: { id: 123, ... }
                // 2. A number (ID): 123
                // 3. Undefined (need to fetch)
                let mediaId: number | undefined = undefined
                
                // Method 1: Check if media is a nested object with id
                if ((media as any).media?.id) {
                    mediaId = (media as any).media.id
                }
                // Method 2: Check if media is just a number (ID)
                else if (typeof (media as any).media === 'number') {
                    mediaId = (media as any).media
                }
                // Method 3: Fetch ProductMedia details
                else {
                    try {
                        const productMediaDetail = await apiFetch<ProductMedia>(`${bfgApi.productMedia()}${media.id}/`)
                        if ((productMediaDetail as any).media?.id) {
                            mediaId = (productMediaDetail as any).media.id
                        } else if (typeof (productMediaDetail as any).media === 'number') {
                            mediaId = (productMediaDetail as any).media
                        }
                    } catch (fetchError) {
                        console.error('Failed to fetch ProductMedia details', fetchError)
                    }
                }
                
                // If we still don't have mediaId, use copyProductMediaToProduct as fallback
                // This will copy the ProductMedia to the current product, then we can create a new one for the variant
                if (!mediaId && productIdNumber !== undefined) {
                    const sourceProductMediaId = media.id
                    const newProductMedia = await copyProductMediaToProduct(sourceProductMediaId, productIdNumber, false)
                    
                    // Try to get Media ID from the copied ProductMedia
                    if ((newProductMedia as any).media?.id) {
                        mediaId = (newProductMedia as any).media.id
                    } else if (typeof (newProductMedia as any).media === 'number') {
                        mediaId = (newProductMedia as any).media
                    }
                    
                    // If we still can't get Media ID, just update the copied ProductMedia to point to this variant
                    if (!mediaId) {
                        const { updateProductMedia } = await import('@/services/store')
                        await updateProductMedia(newProductMedia.id, { variant: variantId })
                        setSnackbar({ open: true, message: t('products.variants.snackbar.imageUpdated'), severity: 'success' })
                        await fetchVariants()
                        setMediaLibraryOpen(false)
                        setMediaLibraryTarget(null)
                        return
                    }
                }
                
                // Check if a ProductMedia already exists for this (product, media, variant) combination
                const existingVariantMedia = productMedia?.find(m => {
                    const mMediaId = (m as any).media?.id || (typeof (m as any).media === 'number' ? (m as any).media : m.id)
                    return mMediaId === mediaId && 
                           m.product === productIdNumber && 
                           m.variant === variantId
                })
                
                let updatedMedia: ProductMedia
                
                if (existingVariantMedia) {
                    // Already associated with this variant, no need to do anything
                    updatedMedia = existingVariantMedia
                } else {
                    // Check if this media already belongs to the current product
                    const existingProductMedia = productMedia?.find(m => {
                        const mMediaId = (m as any).media?.id || (typeof (m as any).media === 'number' ? (m as any).media : m.id)
                        return mMediaId === mediaId && m.product === productIdNumber
                    })
                    
                    let finalMediaId = mediaId
                    
                    if (!existingProductMedia && productIdNumber !== undefined) {
                        // Media belongs to another product or is a generic Media object
                        // Copy the ProductMedia to this product first
                        const sourceProductMediaId = media.id
                        const newProductMedia = await copyProductMediaToProduct(sourceProductMediaId, productIdNumber, false)
                        // Get the Media ID from the copied ProductMedia
                        finalMediaId = (newProductMedia as any).media?.id || (typeof (newProductMedia as any).media === 'number' ? (newProductMedia as any).media : newProductMedia.id)
                    }
                    
                    // Create a new ProductMedia record for this variant (same media, different variant)
                    // This allows multiple variants to share the same Media object
                    updatedMedia = await apiFetch<ProductMedia>(bfgApi.productMedia(), {
                        method: 'POST',
                        body: JSON.stringify({
                            product: productIdNumber,
                            variant: variantId,
                            media_id: finalMediaId,
                            is_product_image: false
                        })
                    })
                }
                
                // Use the updated media's file URL if available
                if (updatedMedia.file && updatedMedia.file !== imageUrl) {
                    setVariantImages(prev => ({ ...prev, [variantId]: updatedMedia.file }))
                }
                
                setSnackbar({ open: true, message: t('products.variants.snackbar.imageUpdated'), severity: 'success' })
                
                // Refresh variants and product media to get the latest data
                await fetchVariants()
            } catch (error) {
                console.error('Failed to update variant media', error)
                const detail =
                    (error as any)?.data?.detail ||
                    (error as any)?.message ||
                    t('products.variants.errors.updateImageFailed')
                setSnackbar({ open: true, message: detail, severity: 'error' })
                // Revert the image update on error
                fetchVariants()
            }
            setMediaLibraryOpen(false)
            setMediaLibraryTarget(null)
        }
    }

    const handleImageClick = (variantId: number | 'new') => {
        setMediaLibraryTarget({ variantId })
        setMediaLibraryOpen(true)
    }

    const handleAddVariant = () => {
        setNewVariant({
            name: '',
            sku: '',
            price: 0,
            stock_quantity: 0
        })
    }

    const handleMove = async (currentIndex: number, direction: number) => {
        const newIndex = currentIndex + direction
        if (newIndex < 0 || newIndex >= variants.length) return

        const updated = [...variants]
        const temp = updated[currentIndex]
        updated[currentIndex] = updated[newIndex]
        updated[newIndex] = temp

        // assign normalized order values
        const ordered = updated.map((v, idx) => ({ ...v, order: (idx + 1) * 10 }))
        setVariants(ordered)

        try {
            await Promise.all(
                ordered.map(v => updateProductVariant(v.id, { order: v.order }))
            )
            setSnackbar({ open: true, message: t('products.variants.snackbar.orderUpdated'), severity: 'success' })
        } catch (error) {
            console.error('Failed to reorder variants', error)
            const detail =
                (error as any)?.data?.detail ||
                (error as any)?.message ||
                t('products.variants.errors.reorderFailed')
            setSnackbar({ open: true, message: detail, severity: 'error' })
            fetchVariants()
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        const variant = variants.find(v => v.id === deleteTarget.id)
        if (variant && variant.stock_quantity > 0) {
            setSnackbar({ open: true, message: t('products.variants.errors.cannotDeleteStock'), severity: 'error' })
            return
        }
        try {
            await deleteProductVariant(deleteTarget.id)
            setDeleteTarget(null)
            fetchVariants()
            setSnackbar({ open: true, message: t('products.variants.snackbar.deleted'), severity: 'success' })
        } catch (error) {
            console.error("Failed to delete variant", error)
            const detail =
                (error as any)?.data?.detail ||
                (error as any)?.message ||
                t('products.variants.errors.deleteFailed')
            setSnackbar({ open: true, message: detail, severity: 'error' })
        }
    }

    return (
        <Card>
            <CardHeader
                title={t('products.variants.title')}
                action={
                    <Button variant='contained' size='small' onClick={handleAddVariant} disabled={!!newVariant}>
                        {t('products.variants.actions.addVariant')}
                    </Button>
                }
                sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
            />
            <CardContent>
                <TableContainer>
                    <Table size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell width={80}>{t('products.variants.table.headers.image')}</TableCell>
                                <TableCell>{t('products.variants.table.headers.name')}</TableCell>
                                <TableCell>{t('products.variants.table.headers.sku')}</TableCell>
                                <TableCell>{t('products.variants.table.headers.price')}</TableCell>
                                <TableCell>{t('products.variants.table.headers.stock')}</TableCell>
                                <TableCell width={120}>{t('products.variants.table.headers.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variants.map((variant, index) => (
                                <TableRow key={variant.id}>
                                    <TableCell>
                                        <Box
                                            onClick={() => handleImageClick(variant.id)}
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                border: variantImages[variant.id] ? 'none' : '1px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'text.disabled',
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    opacity: 0.8,
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            {variantImages[variant.id] ? (
                                                <img src={variantImages[variant.id]} alt={variant.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                t('products.variants.values.clickToAdd')
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === variant.id ? (
                                            <TextField
                                                variant='outlined'
                                                size='small'
                                                value={editDraft.name ?? ''}
                                                onChange={e => setEditDraft(prev => ({ ...prev, name: e.target.value }))}
                                                sx={{ minWidth: 180 }}
                                            />
                                        ) : (
                                            variant.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === variant.id ? (
                                            <TextField
                                                variant='outlined'
                                                size='small'
                                                value={editDraft.sku ?? ''}
                                                onChange={e => setEditDraft(prev => ({ ...prev, sku: e.target.value }))}
                                                sx={{ minWidth: 140 }}
                                            />
                                        ) : (
                                            variant.sku
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === variant.id ? (
                                            <TextField
                                                variant='outlined'
                                                size='small'
                                                type='number'
                                                value={editDraft.price ?? ''}
                                                onChange={e => setEditDraft(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                sx={{ maxWidth: 120 }}
                                            />
                                        ) : (
                                            variant.price
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === variant.id ? (
                                            <Link
                                                component='button'
                                                variant='body2'
                                                onClick={() => {
                                                    if (productIdNumber) {
                                                        setInventoryModalVariantId(variant.id)
                                                        setInventoryModalOpen(true)
                                                    }
                                                }}
                                                sx={{
                                                    cursor: productIdNumber ? 'pointer' : 'default',
                                                    textDecoration: 'underline',
                                                    minWidth: 80,
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {variant.stock_quantity}
                                            </Link>
                                        ) : (
                                            variant.stock_quantity
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size='small' disabled={index === 0} onClick={() => handleMove(index, -1)}>
                                            <i className='tabler-arrow-up' />
                                        </IconButton>
                                        <IconButton size='small' disabled={index === variants.length - 1} onClick={() => handleMove(index, 1)}>
                                            <i className='tabler-arrow-down' />
                                        </IconButton>
                                        {editingId === variant.id ? (
                                            <>
                                                <IconButton
                                                    color='primary'
                                                    size='small'
                                                    onClick={async () => {
                                                        try {
                                                            await updateProductVariant(variant.id, {
                                                                name: editDraft.name ?? variant.name,
                                                                sku: editDraft.sku ?? variant.sku,
                                                                price: editDraft.price ?? variant.price
                                                                // stock_quantity is updated via VariantInventoryModal, don't update here
                                                            })
                                                            setSnackbar({ open: true, message: t('products.variants.snackbar.updated'), severity: 'success' })
                                                            setEditingId(null)
                                                            setEditDraft({})
                                                            fetchVariants()
                                                        } catch (error) {
                                                            console.error('Failed to update variant', error)
                                                            const detail =
                                                                (error as any)?.data?.detail ||
                                                                (error as any)?.message ||
                                                                t('products.variants.errors.updateFailed')
                                                            setSnackbar({ open: true, message: detail, severity: 'error' })
                                                            fetchVariants()
                                                        }
                                                    }}
                                                >
                                                    <i className='tabler-check' />
                                                </IconButton>
                                                <IconButton
                                                    size='small'
                                                    onClick={() => {
                                                        setEditingId(null)
                                                        setEditDraft({})
                                                    }}
                                                >
                                                    <i className='tabler-x' />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <IconButton
                                                size='small'
                                                onClick={() => {
                                                    setEditingId(variant.id)
                                                    setEditDraft({
                                                        name: variant.name,
                                                        sku: variant.sku,
                                                        price: variant.price
                                                        // stock_quantity is managed via VariantInventoryModal
                                                    })
                                                }}
                                            >
                                                <i className='tabler-edit' />
                                            </IconButton>
                                        )}
                                        <IconButton color='error' size='small' onClick={() => setDeleteTarget({ id: variant.id, name: variant.name })}>
                                            <i className='tabler-trash' />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {newVariant && (
                                <TableRow>
                                    <TableCell>
                                        <Box
                                            onClick={() => handleImageClick('new')}
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                border: newVariant.imageUrl ? 'none' : '1px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'text.disabled',
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    opacity: 0.8,
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            {newVariant.imageUrl ? (
                                                <img src={newVariant.imageUrl} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                t('products.variants.values.clickToAdd')
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant='outlined'
                                            size='small'
                                            placeholder={t('products.variants.new.placeholders.name')}
                                            value={newVariant.name || ''}
                                            onChange={e => setNewVariant(prev => prev ? { ...prev, name: e.target.value } : { name: e.target.value })}
                                            sx={{ minWidth: 180 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant='outlined'
                                            size='small'
                                            placeholder={t('products.variants.new.placeholders.sku')}
                                            value={newVariant.sku || ''}
                                            onChange={e => setNewVariant(prev => prev ? { ...prev, sku: e.target.value } : { sku: e.target.value })}
                                            sx={{ minWidth: 140 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant='outlined'
                                            size='small'
                                            type='number'
                                            placeholder={t('products.variants.new.placeholders.price')}
                                            value={newVariant.price || ''}
                                            onChange={e => setNewVariant(prev => prev ? { ...prev, price: Number(e.target.value) } : { price: Number(e.target.value) })}
                                            sx={{ maxWidth: 120 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            variant='outlined'
                                            size='small'
                                            type='number'
                                            placeholder={t('products.variants.new.placeholders.stock')}
                                            value={newVariant.stock_quantity || ''}
                                            onChange={e => setNewVariant(prev => prev ? { ...prev, stock_quantity: Number(e.target.value) } : { stock_quantity: Number(e.target.value) })}
                                            sx={{ maxWidth: 120 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            color='primary'
                                            size='small'
                                            onClick={handleCreate}
                                            disabled={!newVariant.name || !newVariant.sku}
                                        >
                                            <i className='tabler-check' />
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                            onClick={() => setNewVariant(null)}
                                        >
                                            <i className='tabler-x' />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )}
                            {variants.length === 0 && !newVariant && (
                                <TableRow>
                                    <TableCell colSpan={6} align='center'>{t('products.variants.table.empty')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
            <DialogTitle>{t('products.variants.deleteDialog.title')}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    {t('products.variants.deleteDialog.messageWithName', {
                        name: deleteTarget?.name || t('products.variants.deleteDialog.thisVariant')
                    })}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteTarget(null)}>{t('products.variants.deleteDialog.actions.cancel')}</Button>
                <Button color='error' variant='contained' onClick={handleDeleteConfirm}>{t('products.variants.deleteDialog.actions.delete')}</Button>
            </DialogActions>
        </Dialog>
        <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
        <MediaLibraryDialog
            open={mediaLibraryOpen}
            onClose={() => {
                setMediaLibraryOpen(false)
                setMediaLibraryTarget(null)
            }}
            onSelect={handleSelectVariantMedia}
            productId={productIdNumber || undefined}
            title={t('products.variants.mediaDialog.title')}
        />
        {productIdNumber && (
            <VariantInventoryModal
                open={inventoryModalOpen}
                onClose={() => {
                    setInventoryModalOpen(false)
                    setInventoryModalVariantId(undefined)
                }}
                productId={productIdNumber}
                variantId={inventoryModalVariantId}
                onUpdate={() => {
                    fetchVariants()
                }}
            />
        )}
        </Card>
    )
}

export default ProductVariants
