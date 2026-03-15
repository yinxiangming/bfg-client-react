'use client'

import { useState, useEffect, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type ImageViewerItem = { url: string; alt?: string }

const MIN_SCALE = 0.25
const MAX_SCALE = 4
const SCALE_STEP = 0.25
const ROTATE_STEP = 90

type ImageViewerDialogProps = {
    open: boolean
    onClose: () => void
    /** List of images; use single item for single-image view. */
    images: ImageViewerItem[]
    /** Initial index when opening (0-based). */
    initialIndex?: number
    /** Optional i18n labels; omit to hide toolbar labels. */
    labels?: {
        close?: string
        zoomIn?: string
        zoomOut?: string
        rotate?: string
        prev?: string
        next?: string
        /** Format counter; use function when using i18n that requires passing variables (e.g. next-intl). */
        imageCounter?: string | ((current: number, total: number) => string)
    }
}

export default function ImageViewerDialog({
    open,
    onClose,
    images,
    initialIndex = 0,
    labels = {}
}: ImageViewerDialogProps) {
    const [index, setIndex] = useState(initialIndex)
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)

    const item = images[index]
    const hasMultiple = images.length > 1

    // Sync to initialIndex when dialog opens; reset zoom/rotate when opening or changing image
    useEffect(() => {
        if (open) {
            setIndex(Math.min(initialIndex, Math.max(0, images.length - 1)))
            setScale(1)
            setRotation(0)
        }
    }, [open, initialIndex, images.length])

    const goPrev = useCallback(() => {
        setIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
        setScale(1)
        setRotation(0)
    }, [images.length])

    const goNext = useCallback(() => {
        setIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
        setScale(1)
        setRotation(0)
    }, [images.length])

    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === 'ArrowRight') goNext()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [open, onClose, goPrev, goNext])

    const handleZoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))
    const handleZoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))
    const handleRotate = () => setRotation((r) => (r + ROTATE_STEP) % 360)

    if (!item) return null

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            fullScreen={false}
            PaperProps={{
                sx: {
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    maxWidth: '100vw',
                    maxHeight: '100vh'
                }
            }}
            slotProps={{
                backdrop: {
                    sx: { bgcolor: 'rgba(0,0,0,0.9)' }
                }
            }}
            sx={{ '& .MuiDialog-container': { alignItems: 'center' } }}
        >
            <DialogContent
                onClick={onClose}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    overflow: 'hidden',
                    p: 0
                }}
            >
                <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: '100%',
                        flex: 1
                    }}
                >
                    <Box
                        component="img"
                        src={item.url}
                        alt={item.alt ?? ''}
                        sx={{
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            objectFit: 'contain',
                            transform: `scale(${scale}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease'
                        }}
                        draggable={false}
                    />
                </Box>

                {/* Toolbar */}
                <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        borderRadius: 2,
                        py: 0.5,
                        px: 1
                    }}
                >
                    <IconButton size="small" onClick={onClose} sx={{ color: 'white' }} title={labels.close}>
                        <i className='tabler-x' style={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" onClick={handleZoomOut} sx={{ color: 'white' }} title={labels.zoomOut} disabled={scale <= MIN_SCALE}>
                        <i className='tabler-minus' style={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: 'white', minWidth: 48, textAlign: 'center' }}>
                        {Math.round(scale * 100)}%
                    </Typography>
                    <IconButton size="small" onClick={handleZoomIn} sx={{ color: 'white' }} title={labels.zoomIn} disabled={scale >= MAX_SCALE}>
                        <i className='tabler-plus' style={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" onClick={handleRotate} sx={{ color: 'white' }} title={labels.rotate}>
                        <i className='tabler-rotate-clockwise' style={{ fontSize: 20 }} />
                    </IconButton>
                    {hasMultiple && (
                        <>
                            <IconButton size="small" onClick={goPrev} sx={{ color: 'white' }} title={labels.prev}>
                                <i className='tabler-chevron-left' style={{ fontSize: 20 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'white', minWidth: 56, textAlign: 'center' }}>
                                {typeof labels.imageCounter === 'function'
                                    ? labels.imageCounter(index + 1, images.length)
                                    : (labels.imageCounter ?? '{current} / {total}')
                                          .replace('{current}', String(index + 1))
                                          .replace('{total}', String(images.length))}
                            </Typography>
                            <IconButton size="small" onClick={goNext} sx={{ color: 'white' }} title={labels.next}>
                                <i className='tabler-chevron-right' style={{ fontSize: 20 }} />
                            </IconButton>
                        </>
                    )}
                </Box>

                {/* Prev/Next arrows on sides when multiple images */}
                {hasMultiple && (
                    <>
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); goPrev() }}
                            sx={{
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.4)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                            }}
                            size="large"
                            title={labels.prev}
                        >
                            <i className='tabler-chevron-left' style={{ fontSize: 28 }} />
                        </IconButton>
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); goNext() }}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                bgcolor: 'rgba(0,0,0,0.4)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                            }}
                            size="large"
                            title={labels.next}
                        >
                            <i className='tabler-chevron-right' style={{ fontSize: 28 }} />
                        </IconButton>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
