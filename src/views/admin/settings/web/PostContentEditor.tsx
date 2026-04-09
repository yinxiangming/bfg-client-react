'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

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

import '@/libs/styles/tiptapEditor.css'

import type { Media } from '@/services/web'
import { getMediaUrl } from '@/utils/media'

import CmsMediaPickerDialog from './CmsMediaPickerDialog'

const EditorToolbar = ({
  editor,
  onOpenResize,
  onWarn,
  onOpenMedia,
  insertFromLibraryTitle,
  resizeImageTitle,
  selectImageFirstMessage,
  disabled
}: {
  editor: Editor | null
  onOpenResize: () => void
  onWarn: (msg: string) => void
  onOpenMedia: () => void
  insertFromLibraryTitle: string
  resizeImageTitle: string
  selectImageFirstMessage: string
  disabled?: boolean
}) => {
  const editorState = useEditorState({
    editor,
    selector: (ctx: { editor: Editor | null }) => {
      if (!ctx.editor) {
        return {
          isBold: false,
          isItalic: false,
          isStrike: false
        }
      }
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false
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

  if (!editor || !editorState) return null

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <IconButton
        size='small'
        disabled={disabled}
        {...(editorState.isBold && { color: 'primary' })}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <i className={classnames('tabler-bold', { 'text-textSecondary': !editorState.isBold })} />
      </IconButton>
      <IconButton
        size='small'
        disabled={disabled}
        {...(editorState.isItalic && { color: 'primary' })}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i className={classnames('tabler-italic', { 'text-textSecondary': !editorState.isItalic })} />
      </IconButton>
      <IconButton
        size='small'
        disabled={disabled}
        {...(editorState.isStrike && { color: 'primary' })}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <i className={classnames('tabler-strikethrough', { 'text-textSecondary': !editorState.isStrike })} />
      </IconButton>
      <IconButton size='small' disabled={disabled} onClick={onOpenMedia} title={insertFromLibraryTitle}>
        <i className='tabler-photo text-textSecondary' />
      </IconButton>
      <IconButton size='small' disabled={disabled} onClick={handleImageResize} title={resizeImageTitle}>
        <i className='tabler-arrows-diagonal-2 text-textSecondary' />
      </IconButton>
    </Box>
  )
}

export type PostContentEditorProps = {
  label: string
  value: string
  onChange: (html: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

export default function PostContentEditor({
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false
}: PostContentEditorProps) {
  const t = useTranslations('admin')
  const [resizeOpen, setResizeOpen] = useState(false)
  const [resizeWidth, setResizeWidth] = useState('')
  const [resizeHeight, setResizeHeight] = useState('')
  const [resizeRatio, setResizeRatio] = useState<number | null>(null)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning'
  }>({ open: false, message: '', severity: 'warning' })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: t('settings.web.posts.contentEditor.placeholder')
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
    editable: !disabled,
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    }
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

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
    const styles: string[] = []
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

  const insertMedia = (media: Media) => {
    if (!editor) return
    const src = getMediaUrl(media.file)
    editor.chain().focus().setImage({ src, alt: media.alt_text || media.title || '' }).run()
    setToast({ open: true, message: t('settings.web.posts.contentEditor.toastImageInserted'), severity: 'success' })
  }

  return (
    <Box>
      <Typography variant='body2' sx={{ mb: 0.75, fontWeight: 600 }}>
        {label}
        {required ? (
          <Typography component='span' color='error.main'>
            {' '}
            *
          </Typography>
        ) : null}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        {t('settings.web.posts.contentEditor.hint')}
      </Typography>
      <Card variant='outlined' sx={{ borderRadius: 1 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <EditorToolbar
            editor={editor}
            disabled={disabled}
            onOpenResize={openResizeDialog}
            onWarn={message => setToast({ open: true, message, severity: 'warning' })}
            onOpenMedia={() => setMediaOpen(true)}
            insertFromLibraryTitle={t('settings.web.posts.contentEditor.toolbar.insertFromLibrary')}
            resizeImageTitle={t('settings.web.posts.contentEditor.toolbar.resizeImage')}
            selectImageFirstMessage={t('settings.web.posts.contentEditor.warnings.selectImageFirst')}
          />
          <Divider />
          <Box
            sx={{
              minHeight: 320,
              maxHeight: 560,
              overflow: 'auto',
              px: 2,
              py: 1.5,
              opacity: disabled ? 0.6 : 1
            }}
          >
            <EditorContent editor={editor} className='post-content-editor-root' />
          </Box>
        </CardContent>
      </Card>
      {error ? <FormHelperText error>{error}</FormHelperText> : null}

      <Dialog open={resizeOpen} onClose={() => setResizeOpen(false)} fullWidth maxWidth='xs'>
        <DialogTitle>{t('settings.web.posts.contentEditor.resizeDialog.title')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={t('settings.web.posts.contentEditor.resizeDialog.width')}
            value={resizeWidth}
            onChange={e => handleWidthChange(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('settings.web.posts.contentEditor.resizeDialog.height')}
            value={resizeHeight}
            onChange={e => handleHeightChange(e.target.value)}
            fullWidth
            helperText={
              resizeRatio !== null ? t('settings.web.posts.contentEditor.resizeDialog.keepRatioHint') : ''
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResizeOpen(false)}>{t('common.schemaForm.cancel')}</Button>
          <Button variant='contained' onClick={applyResize}>
            {t('settings.web.posts.contentEditor.resizeDialog.apply')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <CmsMediaPickerDialog open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={insertMedia} />
    </Box>
  )
}
