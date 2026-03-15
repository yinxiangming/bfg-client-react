'use client'

// React Imports
import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Service Imports
import {
  searchProductsByText,
  searchProductsByImage,
  getProductDetails,
  type ProductCandidate,
  type ProductDetails,
  type ProductScannerConfig
} from '@/services/productScanner'

// Component Imports
import ImageViewerDialog, { type ImageViewerItem } from '@/components/ui/ImageViewerDialog'

type ProductScannerDialogProps = {
  open: boolean
  onClose: () => void
  onSelect: (product: ProductDetails) => void | Promise<void>
  config: ProductScannerConfig
}

const ProductScannerDialog = ({ open, onClose, onSelect, config }: ProductScannerDialogProps) => {
  const t = useTranslations('admin.products.scanner')
  const tCommon = useTranslations('admin.common.imageViewer')
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text')
  const [textQuery, setTextQuery] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<ProductCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<ProductCandidate | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerImages, setImageViewerImages] = useState<ImageViewerItem[]>([])

  const handleSearch = async () => {
    setError(null)
    setLoading(true)
    setCandidates([])

    try {
      let results: ProductCandidate[] = []

      if (activeTab === 'text' && textQuery.trim()) {
        results = await searchProductsByText(textQuery.trim(), config)
      } else if (activeTab === 'image' && imageFile) {
        results = await searchProductsByImage(imageFile, config)
      } else {
        setError(t('errors.enterQueryOrImage'))
        setLoading(false)
        return
      }

      setCandidates(results)

      if (results.length === 0) {
        setError(t('errors.noProducts'))
      }
    } catch (err: any) {
      console.error('Product search error:', err)
      setError(err.message || t('errors.searchFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCandidate = async (candidate: ProductCandidate) => {
    setSelectedCandidate(candidate)
    setLoading(true)
    setError(null)

    try {
      const details = await getProductDetails(candidate, config)
      await onSelect(details)
      handleClose()
    } catch (err: any) {
      console.error('Failed to get product details:', err)
      setError(err.message || t('errors.detailsFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTextQuery('')
    setImageFile(null)
    setCandidates([])
    setSelectedCandidate(null)
    setError(null)
    setImageViewerOpen(false)
    setImageViewerImages([])
    setActiveTab('text')
    onClose()
  }

  const openImageViewer = (candidate: ProductCandidate, e: React.MouseEvent) => {
    e.stopPropagation()
    const urls = candidate.image_urls?.length
      ? candidate.image_urls
      : candidate.image_url
        ? [candidate.image_url]
        : []
    if (urls.length === 0) return
    setImageViewerImages(urls.map((url) => ({ url, alt: candidate.name })))
    setImageViewerOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setCandidates([])
      setError(null)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className='tabler-scan' style={{ fontSize: '1.5rem' }} />
          <span>{t('title')}</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value)
            setCandidates([])
            setError(null)
          }}
          sx={{ mb: 3 }}
        >
          <Tab label={t('tabs.text')} value='text' icon={<i className='tabler-search' />} iconPosition='start' />
          <Tab label={t('tabs.image')} value='image' icon={<i className='tabler-photo' />} iconPosition='start' />
        </Tabs>

        {/* Text Search Tab */}
        {activeTab === 'text' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label={t('fields.productNameLabel')}
              placeholder={t('fields.productNamePlaceholder')}
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleSearch()
                }
              }}
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: <i className='tabler-search' style={{ marginRight: 8 }} />
                }
              }}
            />
          </Box>
        )}

        {/* Image Upload Tab */}
        {activeTab === 'image' && (
          <Box sx={{ mb: 3 }}>
            <Button
              component='label'
              variant='outlined'
              fullWidth
              startIcon={<i className='tabler-upload' />}
              disabled={loading}
            >
              {imageFile ? imageFile.name : t('fields.uploadImage')}
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={handleImageChange}
              />
            </Button>
            {imageFile && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={imageFile.name}
                  onDelete={() => {
                    setImageFile(null)
                    setCandidates([])
                  }}
                  color='primary'
                  variant='outlined'
                />
              </Box>
            )}
          </Box>
        )}

        <Button
          fullWidth
          variant='contained'
          onClick={handleSearch}
          disabled={loading || (activeTab === 'text' && !textQuery.trim()) || (activeTab === 'image' && !imageFile)}
          startIcon={loading ? <CircularProgress size={16} /> : <i className='tabler-scan' />}
        >
          {loading ? t('actions.scanning') : t('actions.search')}
        </Button>

        {error && (
          <Alert severity='error' sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {candidates.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              {t('selectProduct', { count: candidates.length })}
            </Typography>
            <List sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
              {candidates.map((candidate, index) => (
                <ListItem key={index} disablePadding divider={index < candidates.length - 1}>
                  <ListItemButton
                    onClick={() => handleSelectCandidate(candidate)}
                    disabled={loading}
                    sx={{ alignItems: 'stretch', py: 1.5 }}
                  >
                    {/* Thumbnail: click opens ImageViewerDialog; badge when multiple images */}
                    <Box
                      component='span'
                      onClick={(e) => openImageViewer(candidate, e)}
                      sx={{
                        position: 'relative',
                        width: 56,
                        minWidth: 56,
                        height: 56,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        mr: 2,
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: candidate.image_url || (candidate.image_urls?.length ?? 0) > 0 ? 'pointer' : 'default'
                      }}
                    >
                      {candidate.image_url ? (
                        <Box
                          component='img'
                          src={candidate.image_url}
                          alt=''
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            const el = e.target as HTMLImageElement
                            el.style.display = 'none'
                          }}
                        />
                      ) : (
                        <i className='tabler-photo' style={{ fontSize: 24, color: 'var(--mui-palette-text-secondary)' }} />
                      )}
                      {candidate.image_urls && candidate.image_urls.length > 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            minWidth: 18,
                            height: 18,
                            px: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            bgcolor: 'error.main',
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {candidate.image_urls.length}
                        </Box>
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant='body1' component='span'>
                            {candidate.name}
                          </Typography>
                          {candidate.confidence !== undefined && (
                            <Chip
                              label={`${Math.round(candidate.confidence * 100)}%`}
                              size='small'
                              color={candidate.confidence > 0.8 ? 'success' : 'default'}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <span>
                          {candidate.brand && (
                            <Typography variant='caption' component='span' sx={{ mr: 2 }}>
                              {t('brand')}: {candidate.brand}
                            </Typography>
                          )}
                          {candidate.model && (
                            <Typography variant='caption' component='span'>
                              {t('model')}: {candidate.model}
                            </Typography>
                          )}
                        </span>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {loading && candidates.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('actions.cancel')}
        </Button>
      </DialogActions>

      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={imageViewerImages}
        initialIndex={0}
        labels={{
          close: tCommon('close'),
          zoomIn: tCommon('zoomIn'),
          zoomOut: tCommon('zoomOut'),
          rotate: tCommon('rotate'),
          prev: tCommon('prev'),
          next: tCommon('next'),
          imageCounter: (current, total) => tCommon('imageCounter', { current, total })
        }}
      />
    </Dialog>
  )
}

export default ProductScannerDialog
