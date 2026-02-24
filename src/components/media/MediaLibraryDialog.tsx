'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

// Service Imports
import {
  getProductMedia,
  uploadProductMedia,
  getProductMediaFolders,
  createProductMediaFolder,
  deleteProductMediaFolder,
  deleteProductMediaFile,
  type ProductMedia
} from '@/services/store'
import { useAppDialog } from '@/contexts/AppDialogContext'

type MediaLibraryDialogProps = {
  open: boolean
  onClose: () => void
  onSelect: (media: ProductMedia) => void
  productId?: number
  title?: string
}

const pageSize = 50

const MediaLibraryDialog = ({ open, onClose, onSelect, productId, title = 'Media Library' }: MediaLibraryDialogProps) => {
  const { confirm } = useAppDialog()
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [folders, setFolders] = useState<string[]>([])
  const [items, setItems] = useState<ProductMedia[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'warning'
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProductMedia | null>(null)

  const loadFolders = async () => {
    // Folders are workspace-wide, don't need productId
    setFoldersLoading(true)
    try {
      const resp = await getProductMediaFolders()
      setFolders(resp.folders || [])
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Failed to load folders', severity: 'error' })
    } finally {
      setFoldersLoading(false)
    }
  }

  const load = async (targetPage = 1) => {
    setLoading(true)
    try {
      const resp = await getProductMedia({
        search: search || undefined,
        folder: selectedFolder || undefined,
        page: targetPage,
        pageSize
      })
      
      // Deduplicate items by underlying Media ID
      // Multiple ProductMedia can reference the same Media, so we need to show unique media files only
      const items = resp.items || []
      const seenMediaIds = new Set<number>()
      const uniqueItems: ProductMedia[] = []
      
      for (const item of items) {
        // Get the underlying Media ID
        const mediaId = item.media?.id || (typeof item.media === 'number' ? item.media : null)
        
        if (mediaId && !seenMediaIds.has(mediaId)) {
          seenMediaIds.add(mediaId)
          uniqueItems.push(item)
        } else if (!mediaId) {
          // If no media ID, use ProductMedia ID as fallback
          if (!seenMediaIds.has(item.id)) {
            seenMediaIds.add(item.id)
            uniqueItems.push(item)
          }
        }
      }
      
      setItems(uniqueItems)
      // Keep original total from backend for pagination
      // Items are deduplicated for display only
      setTotal(resp.total || 0)
      setPage(targetPage)
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Failed to load media', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadFolders()
      load(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) {
      load(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder])

  const handleUpload = async (file?: File | null) => {
    if (!file || !productId) return
    try {
      setLoading(true)
      const media = await uploadProductMedia(productId, file, undefined, selectedFolder || undefined)
      // When uploading from Media Library (used in Description), mark as description-only
      // But we need to know the context - if it's from ProductInformation, mark as description-only
      // For now, we'll let the caller handle this via onSelect callback
      await load(1)
      await loadFolders()
      setToast({ open: true, message: 'Uploaded', severity: 'success' })
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Upload failed', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim()
    if (!folderName) {
      setToast({ open: true, message: 'Folder name is required', severity: 'warning' })
      return
    }
    
    // Check if folder already exists
    if (folders.includes(folderName)) {
      setToast({ open: true, message: 'Folder already exists', severity: 'warning' })
      return
    }
    
    try {
      setFoldersLoading(true)
      await createProductMediaFolder(folderName)
      
      // Add folder to local state immediately (before files are uploaded)
      setFolders(prev => {
        const updated = [...prev, folderName].sort()
        return updated
      })
      
      setNewFolderName('')
      setShowNewFolderInput(false)
      setToast({ open: true, message: 'Folder created', severity: 'success' })
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Failed to create folder', severity: 'error' })
    } finally {
      setFoldersLoading(false)
    }
  }

  const handleDeleteFolder = async (folder: string) => {
    // Check if folder is empty (selected folder and no items)
    const isEmpty = selectedFolder === folder && total === 0
    
    const confirmMessage = isEmpty
      ? `Delete empty folder "${folder}"?`
      : `Delete folder "${folder}" and all files in it?`
    
    if (!(await confirm(confirmMessage, { danger: true }))) {
      return
    }
    
    try {
      setFoldersLoading(true)
      const resp = await deleteProductMediaFolder(folder)
      if (selectedFolder === folder) {
        setSelectedFolder('')
      }
      await loadFolders()
      await load(1)
      setToast({ open: true, message: resp.message || 'Folder deleted', severity: 'success' })
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Failed to delete folder', severity: 'error' })
    } finally {
      setFoldersLoading(false)
    }
  }

  const handleDeleteFileClick = (media: ProductMedia, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(media)
    setDeleteDialogOpen(true)
  }

  const handleDeleteFileConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProductMediaFile(deleteTarget.id)
      setToast({ open: true, message: 'File deleted successfully', severity: 'success' })
      await load(page)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    } catch (error: any) {
      setToast({ open: true, message: error?.message || 'Failed to delete file', severity: 'error' })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleDeleteFileCancel = () => {
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ display: 'flex', gap: 2, pt: 2, minHeight: 500 }}>
          {/* Left Sidebar - Folders */}
          <Paper
            sx={{
              width: 250,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Folders
              </Typography>
              {showNewFolderInput ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size='small'
                    placeholder='Folder name'
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleCreateFolder()
                      }
                    }}
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                  <IconButton 
                    size='small' 
                    onClick={handleCreateFolder} 
                    disabled={foldersLoading}
                    color='primary'
                    title='Confirm'
                  >
                    <i className='tabler-check' />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setShowNewFolderInput(false)
                      setNewFolderName('')
                    }}
                    color='error'
                    title='Cancel'
                  >
                    <i className='tabler-x' />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<i className='mdi-folder-plus' />}
                  onClick={() => setShowNewFolderInput(true)}
                  fullWidth
                >
                  New Folder
                </Button>
              )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {foldersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedFolder === ''}
                      onClick={() => setSelectedFolder('')}
                    >
                      <ListItemText primary='All Files' />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                  {folders.map(folder => (
                    <ListItem
                      key={folder}
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge='end'
                          size='small'
                          onClick={() => handleDeleteFolder(folder)}
                          disabled={foldersLoading}
                        >
                          <i className='mdi-delete-outline' style={{ fontSize: 18 }} />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        selected={selectedFolder === folder}
                        onClick={() => setSelectedFolder(folder)}
                      >
                        <i className='mdi-folder' style={{ marginRight: 8, fontSize: 20 }} />
                        <ListItemText primary={folder} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {folders.length === 0 && (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant='caption'>No folders</Typography>
                    </Box>
                  )}
                </List>
              )}
            </Box>
          </Paper>

          {/* Right Content - Media Grid */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Search by name or alt text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    load(1)
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={() => load(1)}>
                        <i className='mdi-magnify' />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant='outlined'
                component='label'
                disabled={!productId || loading}
                startIcon={<i className='mdi-upload' />}
              >
                Upload
                <input
                  type='file'
                  accept='image/*'
                  hidden
                  onChange={e => handleUpload(e.target.files?.[0])}
                />
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedFolder && total === 0 ? (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 2,
                py: 4
              }}>
                <Typography variant='body1' color='text.secondary'>
                  This folder is empty
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<i className='tabler-trash' />}
                  onClick={() => handleDeleteFolder(selectedFolder)}
                  disabled={foldersLoading}
                >
                  Delete Empty Folder
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridAutoRows: '220px',
                  gap: 2,
                  overflow: 'auto',
                  maxHeight: 'calc(100vh - 280px)'
                }}
              >
                {items.map(item => {
                  // Use Media ID as key if available, otherwise use ProductMedia ID
                  const mediaId = item.media?.id || (typeof item.media === 'number' ? item.media : null)
                  const key = mediaId ? `media-${mediaId}` : `product-media-${item.id}`
                  
                  return (
                  <Box
                    key={key}
                    sx={{
                      position: 'relative',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Box
                      onClick={() => {
                        onSelect(item)
                        onClose()
                      }}
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                      <Box
                        component='img'
                        src={item.file}
                        alt={item.alt_text || ''}
                        sx={{ 
                          width: '100%', 
                          flex: 1,
                          objectFit: 'cover', 
                          display: 'block',
                          backgroundColor: 'action.hover'
                        }}
                      />
                      <Box sx={{ p: 1, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
                        {item.alt_text || item.file}
                      </Box>
                    </Box>
                    <IconButton
                      size='small'
                      onClick={(e) => handleDeleteFileClick(item, e)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                      }}
                    >
                      <i className='tabler-trash' style={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  )
                })}
                {items.length === 0 && !selectedFolder && (
                  <Box sx={{ gridColumn: '1 / span 3', textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No media found
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ pl: 2, color: 'text.secondary', fontSize: 13 }}>
            Page {page} · {(items?.length || 0)} / {total}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                if (page > 1) load(page - 1)
              }}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>
            <Button
              onClick={() => {
                if (items.length >= pageSize) load(page + 1)
              }}
              disabled={items.length < pageSize || loading}
            >
              Next
            </Button>
            <Button onClick={onClose}>Close</Button>
          </Box>
        </DialogActions>
      </Dialog>

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
      <Dialog open={deleteDialogOpen} onClose={handleDeleteFileCancel}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this file? This action cannot be undone and will remove the file from storage.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteFileCancel}>Cancel</Button>
          <Button onClick={handleDeleteFileConfirm} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default MediaLibraryDialog
