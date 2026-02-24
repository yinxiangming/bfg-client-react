'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// API Imports
import { getProductMedia, uploadProductMedia, deleteProductMedia, updateProductMedia, copyProductMediaToProduct, type ProductMedia } from '@/services/store'

// Util Imports
import { getMediaUrl } from '@/utils/media'

// Component Imports
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog'

/** Media from product detail API (MediaLink shape) - avoids separate product-media request */
type ProductImageProps = {
    productId: string
    initialMedia?: Array<{ id: number; position?: number; file?: string; media?: { file?: string; alt_text?: string }; alt_text?: string }>
}

// Sortable Image Item Component
const SortableImageItem = ({
    item,
    index,
    onDelete,
    deleteTooltip,
    getAltFallback
}: {
    item: ProductMedia
    index: number
    onDelete: (id: number) => void
    deleteTooltip: string
    getAltFallback: (index1Based: number) => string
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
    }

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'grab',
                backgroundColor: 'background.default',
                minHeight: 120,
                '&:active': { cursor: 'grabbing' }
            }}
            {...attributes}
            {...listeners}
        >
            {(() => {
                const imageUrl = getMediaUrl(item.file || item.media?.file)
                if (!imageUrl) {
                    return (
                        <Box
                            sx={{
                                width: '100%',
                                height: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'action.hover',
                                color: 'text.secondary'
                            }}
                        >
                            <i className='tabler-photo' style={{ fontSize: 32 }} />
                        </Box>
                    )
                }
                return (
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={item.alt_text || item.media?.alt_text || getAltFallback(index + 1)}
                        sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            display: 'block',
                            backgroundColor: 'action.hover'
                        }}
                        draggable={false}
                        onError={(e) => {
                            // Hide image if it fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                        }}
                    />
                )
            })()}
            {/* Order indicator */}
            <Box sx={{
                position: 'absolute',
                top: 4,
                left: 4,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold'
            }}>
                {index + 1}
            </Box>
            {/* Delete button */}
            <Tooltip title={deleteTooltip} placement="top">
                <IconButton
                    color='error'
                    size='small'
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.id)
                    }}
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'error.light' }
                    }}
                >
                    <i className='tabler-trash' style={{ fontSize: 16 }} />
                </IconButton>
            </Tooltip>
        </Box>
    )
}

/** Normalize product-detail media (MediaLink shape) to ProductMedia-like for list/sort */
function normalizeInitialMedia(
    list: Array<{ id: number; position?: number; file?: string; media?: { file?: string; alt_text?: string }; alt_text?: string }> | undefined
): ProductMedia[] {
    if (!list?.length) return []
    return list
        .map((m) => {
            const file = m.file || (m.media?.file as string) || ''
            return {
                id: m.id,
                product: 0,
                file,
                media_type: 'image' as const,
                alt_text: m.alt_text ?? m.media?.alt_text,
                position: m.position ?? 100,
                is_product_image: true,
                media: m.media
                    ? { id: m.id, file: m.media.file || file, media_type: 'image', alt_text: m.media.alt_text ?? m.alt_text }
                    : undefined
            }
        })
        .sort((a, b) => a.position - b.position)
}

const ProductImage = ({ productId, initialMedia }: ProductImageProps) => {
    const t = useTranslations('admin')
    const [media, setMedia] = useState<ProductMedia[]>(() => normalizeInitialMedia(initialMedia))
    const [uploading, setUploading] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    const fetchMedia = useCallback(async () => {
        if (productId === 'new') {
            setMedia([])
            return
        }
        try {
            const response = await getProductMedia({
                productId: parseInt(productId),
                isProductImage: true
            })
            const items = response.items || (Array.isArray(response) ? response : [])
            setMedia(items.sort((a, b) => a.position - b.position))
        } catch (error) {
            console.error("Failed to fetch media", error)
        }
    }, [productId])

    // Use initialMedia from product detail to avoid extra API call; only fetch when missing or after mutations
    useEffect(() => {
        if (initialMedia?.length) {
            setMedia(normalizeInitialMedia(initialMedia))
            return
        }
        if (productId && productId !== 'new') {
            fetchMedia()
        } else if (productId === 'new') {
            setMedia([])
        }
    }, [productId, initialMedia, fetchMedia])

    const handleSelectMedia = async (selectedMedia: ProductMedia) => {
        // For new products, media will be associated after product creation
        if (productId === 'new') {
            // Store selected media temporarily (will be handled by parent component)
            console.log('Media selected for new product:', selectedMedia)
            setMedia(prev => [...prev, selectedMedia])
            return
        }
        
        // Copy media to current product if it belongs to a different product
        // or update is_product_image flag if it's already for this product
        try {
            setUploading(true)
            const currentProductId = parseInt(productId)
            
            if (selectedMedia.product === currentProductId) {
                // Media already belongs to this product, just update is_product_image flag
                if (!selectedMedia.is_product_image) {
                    await updateProductMedia(selectedMedia.id, { is_product_image: true })
                }
            } else {
                // Media belongs to another product, copy it to current product
                await copyProductMediaToProduct(selectedMedia.id, currentProductId, true)
            }
            fetchMedia()
        } catch (error) {
            console.error("Failed to add media to product images", error)
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteClick = (mediaId: number) => {
        setDeleteTargetId(mediaId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId) return
        try {
            await deleteProductMedia(deleteTargetId)
            fetchMedia()
            setDeleteDialogOpen(false)
            setDeleteTargetId(null)
        } catch (error) {
            console.error("Failed to delete media", error)
            setDeleteDialogOpen(false)
            setDeleteTargetId(null)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setDeleteTargetId(null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = media.findIndex((item) => item.id === active.id)
            const newIndex = media.findIndex((item) => item.id === over.id)

            // Optimistically update UI
            const newOrder = arrayMove(media, oldIndex, newIndex)
            setMedia(newOrder)

            // Update positions in database
            try {
                const updatePromises = newOrder.map((item, index) =>
                    updateProductMedia(item.id, { position: index })
                )
                await Promise.all(updatePromises)
            } catch (error) {
                console.error("Failed to update positions", error)
                // Revert on error
                fetchMedia()
            }
        }
    }

    return (
        <Card>
            <CardHeader
                title={t('products.media.title')}
                subheader={t('products.media.subtitle')}
                action={
                    <Button
                        variant='contained'
                        onClick={() => setMediaLibraryOpen(true)}
                        disabled={uploading}
                        size='small'
                    >
                        {t('products.media.actions.selectImage')}
                    </Button>
                }
                sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
            />
            <CardContent>
                {media.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={media.map(m => m.id)}
                            strategy={rectSortingStrategy}
                        >
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: 2
                            }}>
                                {media.map((item, index) => (
                                    <SortableImageItem
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onDelete={handleDeleteClick}
                                        deleteTooltip={t('products.media.actions.delete')}
                                        getAltFallback={(i) => t('products.media.imageAltFallback', { index: i })}
                                    />
                                ))}
                            </Box>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Typography color='text.secondary' align='center' sx={{ py: 4 }}>
                        {t('products.media.empty')}
                    </Typography>
                )}
            </CardContent>
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('products.media.deleteDialog.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('products.media.deleteDialog.message')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>{t('products.media.deleteDialog.actions.cancel')}</Button>
                    <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
                        {t('products.media.deleteDialog.actions.remove')}
                    </Button>
                </DialogActions>
            </Dialog>
            <MediaLibraryDialog
                open={mediaLibraryOpen}
                onClose={() => setMediaLibraryOpen(false)}
                onSelect={async (media) => {
                    await handleSelectMedia(media)
                    setMediaLibraryOpen(false)
                }}
                productId={productId === 'new' ? undefined : parseInt(productId)}
                title={t('products.media.mediaDialog.title')}
            />
        </Card>
    )
}

export default ProductImage
