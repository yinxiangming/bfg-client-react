'use client'

// React Imports
import { useEffect, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { Bold } from '@tiptap/extension-bold'
import { Italic } from '@tiptap/extension-italic'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Strike } from '@tiptap/extension-strike'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import classnames from 'classnames'

// Components Imports
import IconButton from '@mui/material/IconButton'

// Style Imports
import '@/libs/styles/tiptapEditor.css'

// Type Imports
import type { Product, ProductMedia } from '@/services/store'
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog'

const EditorToolbar = ({
    editor,
    onOpenResize,
    onWarn,
    onOpenMedia,
    insertFromLibraryTitle,
    resizeImageTitle,
    selectImageFirstMessage,
    productId
}: {
    editor: Editor | null
    onOpenResize: () => void
    onWarn: (msg: string) => void
    onOpenMedia: () => void
    insertFromLibraryTitle: string
    resizeImageTitle: string
    selectImageFirstMessage: string
    productId?: number
}) => {

    const editorState = useEditorState({
        editor,
        selector: (ctx: { editor: Editor | null }) => {
            if (!ctx.editor) {
                return {
                    isBold: false,
                    isItalic: false,
                    isUnderline: false,
                    isStrike: false,
                    isLeftAligned: true,
                    isCenterAligned: false,
                    isRightAligned: false,
                    isJustified: false
                }
            }

            return {
                isBold: ctx.editor.isActive('bold') ?? false,
                isItalic: ctx.editor.isActive('italic') ?? false,
                isUnderline: ctx.editor.isActive('underline') ?? false,
                isStrike: ctx.editor.isActive('strike') ?? false,
                isLeftAligned: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
                isCenterAligned: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
                isRightAligned: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
                isJustified: ctx.editor.isActive({ textAlign: 'justify' }) ?? false
            }
        }
    })


    const handleImageResize = () => {
        if (!editor) return
        if (!editor.isActive('image')) {
            onWarn(selectImageFirstMessage)
            return
        }
        onOpenResize()
    }

    if (!editor || !editorState) {
        return null
    }

    return (
        <div className='flex flex-wrap items-center gap-1 p-4 border-b border-solid border-border'>
            <IconButton
                {...(editorState.isBold && { color: 'primary' })}
                size='small'
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <i className={classnames('tabler-bold', { 'text-textSecondary': !editorState.isBold })} />
            </IconButton>
            <IconButton
                {...(editorState.isItalic && { color: 'primary' })}
                size='small'
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <i className={classnames('tabler-italic', { 'text-textSecondary': !editorState.isItalic })} />
            </IconButton>
            <IconButton
                {...(editorState.isStrike && { color: 'primary' })}
                size='small'
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                <i className={classnames('tabler-strikethrough', { 'text-textSecondary': !editorState.isStrike })} />
            </IconButton>
            <IconButton
                size='small'
                onClick={onOpenMedia}
                title={insertFromLibraryTitle}
            >
                <i className='tabler-photo text-textSecondary' />
            </IconButton>
            <IconButton
                size='small'
                onClick={handleImageResize}
                title={resizeImageTitle}
            >
                <i className='tabler-arrows-diagonal-2 text-textSecondary' />
            </IconButton>
        </div>
    )
}

type ProductDescriptionProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const ProductDescription = ({ productData, onChange }: ProductDescriptionProps) => {
    const t = useTranslations('admin')
    const [resizeOpen, setResizeOpen] = useState(false)
    const [resizeWidth, setResizeWidth] = useState('')
    const [resizeHeight, setResizeHeight] = useState('')
    const [resizeRatio, setResizeRatio] = useState<number | null>(null)
    const [mediaOpen, setMediaOpen] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
        open: false,
        message: '',
        severity: 'warning'
    })

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: t('products.description.editor.placeholder')
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Bold,
            Italic,
            Strike,
            Underline,
            Image.configure({
                HTMLAttributes: {
                    style: 'max-width: 100%; height: auto;'
                }
            })
        ],
        immediatelyRender: false,
        content: productData?.description || '',
        onUpdate: ({ editor }) => {
            onChange?.('description', editor.getHTML())
        }
    })

    // Update editor content when productData changes
    useEffect(() => {
        if (editor && productData?.description && editor.getHTML() !== productData.description) {
            editor.commands.setContent(productData.description)
        }
    }, [productData?.description, editor])

    const openResizeDialog = () => {
        if (!editor) return
        const attrs = editor.getAttributes('image') || {}
        const style: string = attrs.style || ''
        const widthMatch = style.match(/width:\s*([0-9.]+)px/i)
        const heightMatch = style.match(/height:\s*([0-9.]+)px/i)
        const widthVal = widthMatch ? widthMatch[1] + 'px' : ''
        const heightVal = heightMatch ? heightMatch[1] + 'px' : ''
        setResizeWidth(widthVal)
        setResizeHeight(heightVal)
        if (widthMatch && heightMatch) {
            const w = parseFloat(widthMatch[1])
            const h = parseFloat(heightMatch[1])
            setResizeRatio(w > 0 ? h / w : null)
        } else {
            setResizeRatio(null)
        }
        setResizeOpen(true)
    }

    const applyResize = () => {
        if (!editor) return
        const widthVal = resizeWidth.trim()
        const heightVal = resizeHeight.trim()
        const styles = []
        if (widthVal) styles.push(`width: ${widthVal};`)
        if (heightVal) styles.push(`height: ${heightVal};`)
        if (!heightVal) styles.push('height: auto;')
        editor.chain().focus().updateAttributes('image', { style: styles.join(' ') }).run()
        setResizeOpen(false)
    }

    const handleWidthChange = (val: string) => {
        setResizeWidth(val)
        if (resizeRatio !== null) {
            const num = parseFloat(val)
            if (!isNaN(num)) {
                setResizeHeight(`${(num * resizeRatio).toFixed(0)}px`)
            }
        }
    }

    const handleHeightChange = (val: string) => {
        setResizeHeight(val)
        if (resizeRatio !== null) {
            const num = parseFloat(val)
            if (!isNaN(num) && resizeRatio !== 0) {
                setResizeWidth(`${(num / resizeRatio).toFixed(0)}px`)
            }
        }
    }

    return (
        <>
            <Card>
                <CardHeader title={t('products.description.cardTitle')} />
                <CardContent>
                    <Typography className='mbe-1'>{t('products.description.descriptionHint')}</Typography>
                    <Card className='p-0 border shadow-none'>
                        <CardContent className='p-0'>
                            <EditorToolbar
                                editor={editor}
                                onOpenResize={openResizeDialog}
                                onWarn={message => setToast({ open: true, message, severity: 'warning' })}
                                onOpenMedia={() => setMediaOpen(true)}
                                insertFromLibraryTitle={t('products.description.toolbar.insertFromLibrary')}
                                resizeImageTitle={t('products.description.toolbar.resizeImage')}
                                selectImageFirstMessage={t('products.description.warnings.selectImageFirst')}
                                productId={productData?.id}
                            />
                            <Divider className='mli-6' />
                            <EditorContent editor={editor} className='bs-[500px] overflow-y-auto flex ' />
                        </CardContent>
                    </Card>
                </CardContent>
                <Dialog open={resizeOpen} onClose={() => setResizeOpen(false)} fullWidth maxWidth='xs'>
                    <DialogTitle>{t('products.description.resizeDialog.title')}</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label={t('products.description.resizeDialog.fields.width.label')}
                            placeholder={t('products.description.resizeDialog.fields.width.placeholder')}
                            value={resizeWidth}
                            onChange={e => handleWidthChange(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label={t('products.description.resizeDialog.fields.height.label')}
                            placeholder={t('products.description.resizeDialog.fields.height.placeholder')}
                            value={resizeHeight}
                            onChange={e => handleHeightChange(e.target.value)}
                            fullWidth
                            helperText={
                              resizeRatio !== null ? t('products.description.resizeDialog.fields.height.helperKeepRatio') : ''
                            }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResizeOpen(false)}>{t('products.description.resizeDialog.actions.cancel')}</Button>
                        <Button variant='contained' onClick={applyResize}>{t('products.description.resizeDialog.actions.apply')}</Button>
                    </DialogActions>
                </Dialog>
            </Card>
            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={toast.severity} onClose={() => setToast(prev => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
            <MediaLibraryDialog
                open={mediaOpen}
                onClose={() => setMediaOpen(false)}
                onSelect={async (media) => {
                    if (!editor || !productData?.id) return
                    
                    // Mark media as description-only (not a product image)
                    try {
                        const { updateProductMedia } = await import('@/services/store')
                        await updateProductMedia(media.id, { is_product_image: false })
                    } catch (error) {
                        console.warn('Failed to update media as description-only:', error)
                        // Continue anyway - insert the image even if update fails
                    }
                    
                    editor.chain().focus().setImage({ src: media.file, alt: media.alt_text || '' }).run()
                    setToast({ open: true, message: t('products.description.toast.imageInserted'), severity: 'success' })
                }}
                productId={productData?.id}
            />
        </>
    )
}

export default ProductDescription

