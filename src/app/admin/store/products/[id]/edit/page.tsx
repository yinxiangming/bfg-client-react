'use client'

// React Imports
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Component Imports
import ProductEditHeader from '@/views/admin/store/products/edit/ProductEditHeader'
import ProductInformation from '@/views/admin/store/products/edit/ProductInformation'
import ProductImage from '@/views/admin/store/products/edit/ProductImage'
import ProductDescription from '@/views/admin/store/products/edit/ProductDescription'
import ProductVariants from '@/views/admin/store/products/edit/ProductVariants'
import ProductInventory from '@/views/admin/store/products/edit/ProductInventory'
import ProductPricing from '@/views/admin/store/products/edit/ProductPricing'
import ProductOrganize from '@/views/admin/store/products/edit/ProductOrganize'

// Extension Hooks
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { useDataHooks } from '@/extensions/hooks/useDataHooks'

// API Imports
import { getProduct, updateProduct, type Product } from '@/services/store'

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const [productData, setProductData] = useState<Partial<Product> | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Extension hooks
  const { visibleSections, beforeSections, afterSections, replacements } = 
    usePageSections('admin/store/products/edit')
  const { runOnLoad, runOnSave, runAfterSave } = useDataHooks('admin/store/products/edit')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let data = await getProduct(parseInt(id))
        // Apply extension onLoad hooks
        data = await runOnLoad(data)
        setProductData(data)
        setFormData(data)
      } catch (error) {
        console.error("Failed to fetch product", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, runOnLoad])

  // Update form data when child components change
  const handleChange = useCallback((field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Save product
  const handleSave = async () => {
    setSaving(true)
    try {
      // Merge original data with changes to ensure we don't lose any fields
      let dataToSave = { ...productData, ...formData }

      // Apply extension onSave hooks
      dataToSave = await runOnSave(dataToSave)

      // Filter out read-only fields before sending
      const { id: _id, created_at, updated_at, media, variants, categories, tags, ...editableData } = dataToSave as any
      
      // Ensure category_ids, tag_ids, and tag_names are included if they exist in formData
      if ((formData as any)?.category_ids) {
        editableData.category_ids = (formData as any).category_ids
      }
      if ((formData as any)?.tag_ids) {
        editableData.tag_ids = (formData as any).tag_ids
      }
      if ((formData as any)?.tag_names) {
        editableData.tag_names = (formData as any).tag_names
      }
      // Handle tag_data if it exists (contains both tag_ids and tag_names)
      if ((formData as any)?.tag_data) {
        const tagData = (formData as any).tag_data
        if (tagData.tag_ids) {
          editableData.tag_ids = tagData.tag_ids
        }
        if (tagData.tag_names) {
          editableData.tag_names = tagData.tag_names
        }
      }

      // Ensure language is included for tag creation
      if (!editableData.language) {
        editableData.language = locale
      }

      console.log('Full formData:', formData)
      console.log('Merged dataToSave:', dataToSave)
      console.log('Editable data being sent:', editableData)

      const response = await updateProduct(parseInt(id), editableData)
      console.log('Update response:', response)

      // Update productData with the response to reflect saved state
      setProductData(response)
      setFormData(response)

      // Run extension afterSave hooks (e.g. ResaleProduct create/update)
      await runAfterSave({ productId: parseInt(id), formData })

      setSnackbar({ open: true, message: t('products.edit.snackbar.saved'), severity: 'success' })
    } catch (error: any) {
      console.error('Failed to save product', error)
      setSnackbar({ open: true, message: error.message || t('products.edit.snackbar.saveFailed'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Render section with support for replace
  const renderSection = (sectionId: string, DefaultComponent: React.ComponentType<any>, props?: any) => {
    if (!visibleSections.includes(sectionId)) return null
    const replacement = replacements.get(sectionId)
    const Component = replacement?.component || DefaultComponent
    return <Component {...props} />
  }

  // Discard changes
  const handleDiscard = () => {
    router.push('/admin/store/products')
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!productData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        {t('products.edit.states.notFound')}
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <ProductEditHeader
            productId={id}
            onSave={handleSave}
            onDiscard={handleDiscard}
            saving={saving}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={4}>
            {/* Extension sections before default sections */}
            {beforeSections.map(ext => (
              ext.component && (
                <Grid key={ext.id} size={{ xs: 12 }}>
                  <ext.component productData={formData} onChange={handleChange} />
                </Grid>
              )
            ))}

            {/* Default sections with support for hide/replace */}
            {visibleSections.includes('ProductInformation') && (
              <Grid key="ProductInformation" size={{ xs: 12 }}>
                {renderSection('ProductInformation', ProductInformation, {
                  productData: formData,
                  onChange: handleChange
                })}
              </Grid>
            )}
            {visibleSections.includes('ProductImage') && (
              <Grid key="ProductImage" size={{ xs: 12 }}>
                {renderSection('ProductImage', ProductImage, {
                  productId: id,
                  initialMedia: (productData as any)?.media
                })}
              </Grid>
            )}
            {visibleSections.includes('ProductDescription') && (
              <Grid key="ProductDescription" size={{ xs: 12 }}>
                {renderSection('ProductDescription', ProductDescription, {
                  productData: formData,
                  onChange: handleChange
                })}
              </Grid>
            )}
            {visibleSections.includes('ProductVariants') && (
              <Grid key="ProductVariants" size={{ xs: 12 }}>
                {renderSection('ProductVariants', ProductVariants, {
                  productId: id,
                  productMedia: (productData as any)?.media,
                  initialVariants: (productData as any)?.variants
                })}
              </Grid>
            )}

            {/* Extension sections after default sections (left column only; right-column targets rendered in sidebar) */}
            {afterSections
              .filter(ext => !ext.targetSection || !['ProductPricing', 'ProductInventory', 'ProductOrganize'].includes(ext.targetSection))
              .map(ext => ext.component && (
                <Grid key={ext.id} size={{ xs: 12 }}>
                  <ext.component productData={formData} onChange={handleChange} />
                </Grid>
              ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={4}>
            {visibleSections.includes('ProductPricing') && (
              <Grid key="ProductPricing" size={{ xs: 12 }}>
                {renderSection('ProductPricing', ProductPricing, {
                  productData: formData,
                  onChange: handleChange
                })}
              </Grid>
            )}
            {/* Extension sections after ProductPricing (e.g. Resale) */}
            {afterSections
              .filter(ext => ext.targetSection === 'ProductPricing')
              .map(ext => ext.component && (
                <Grid key={ext.id} size={{ xs: 12 }}>
                  <ext.component productData={formData} onChange={handleChange} />
                </Grid>
              ))}
            {visibleSections.includes('ProductInventory') && (
              <Grid key="ProductInventory" size={{ xs: 12 }}>
                {renderSection('ProductInventory', ProductInventory, {
                  productData: formData,
                  onChange: handleChange
                })}
              </Grid>
            )}
            {afterSections
              .filter(ext => ext.targetSection === 'ProductInventory')
              .map(ext => ext.component && (
                <Grid key={ext.id} size={{ xs: 12 }}>
                  <ext.component productData={formData} onChange={handleChange} />
                </Grid>
              ))}
            {visibleSections.includes('ProductOrganize') && (
              <Grid key="ProductOrganize" size={{ xs: 12 }}>
                {renderSection('ProductOrganize', ProductOrganize, {
                  productData: formData,
                  onChange: handleChange
                })}
              </Grid>
            )}
            {afterSections
              .filter(ext => ext.targetSection === 'ProductOrganize')
              .map(ext => ext.component && (
                <Grid key={ext.id} size={{ xs: 12 }}>
                  <ext.component productData={formData} onChange={handleChange} />
                </Grid>
              ))}
          </Grid>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

