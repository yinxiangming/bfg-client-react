'use client'

// React Imports
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
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
import { renderSection } from '@/extensions/hooks/renderSection'

// API Imports
import { createProduct, type Product } from '@/services/store'

export default function ProductAddPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const { visibleSections, beforeSections, afterSections, replacements } =
    usePageSections('admin/store/products/add')

  // Update form data when child components change
  const handleChange = useCallback((field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Create product
  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepare data for creation
      const dataToSave = { ...formData }

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

      // Set default values if not provided
      if (!editableData.product_type) {
        editableData.product_type = 'physical'
      }
      if (editableData.is_active === undefined) {
        editableData.is_active = true
      }

      // Generate slug from name if not provided
      if (!editableData.slug && editableData.name) {
        // Simple slugify function
        editableData.slug = editableData.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      }

      // Ensure slug is provided (required field)
      if (!editableData.slug) {
        throw new Error(t('products.addPage.errors.nameRequiredForSlug'))
      }

      console.log('Creating product with data:', editableData)

      const response = await createProduct(editableData)
      console.log('Create response:', response)

      setSnackbar({ open: true, message: t('products.addPage.snackbar.created'), severity: 'success' })
      
      // Redirect to edit page after successful creation
      setTimeout(() => {
        router.push(`/admin/store/products/${response.id}/edit`)
      }, 1000)
    } catch (error: any) {
      console.error('Failed to create product', error)
      setSnackbar({ open: true, message: error.message || t('products.addPage.snackbar.createFailed'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Discard changes
  const handleDiscard = () => {
    router.push('/admin/store/products')
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <ProductEditHeader
            productId="new"
            onSave={handleSave}
            onDiscard={handleDiscard}
            saving={saving}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={6}>
            {beforeSections.map(
              ext =>
                ext.component && (
                  <Grid key={ext.id} size={{ xs: 12 }}>
                    <ext.component productData={formData} onChange={handleChange} />
                  </Grid>
                )
            )}
            {visibleSections.includes('ProductInformation') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductInformation',
                  visibleSections,
                  replacements,
                  ProductInformation,
                  { productData: formData, onChange: handleChange }
                )}
              </Grid>
            )}
            {visibleSections.includes('ProductImage') && (
              <Grid size={{ xs: 12 }}>
                {renderSection('ProductImage', visibleSections, replacements, ProductImage, {
                  productId: 'new'
                })}
              </Grid>
            )}
            {visibleSections.includes('ProductDescription') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductDescription',
                  visibleSections,
                  replacements,
                  ProductDescription,
                  { productData: formData, onChange: handleChange }
                )}
              </Grid>
            )}
            {visibleSections.includes('ProductVariants') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductVariants',
                  visibleSections,
                  replacements,
                  ProductVariants,
                  { productId: 'new', productMedia: [], initialVariants: [] }
                )}
              </Grid>
            )}
            {afterSections.map(
              ext =>
                ext.component && (
                  <Grid key={ext.id} size={{ xs: 12 }}>
                    <ext.component productData={formData} onChange={handleChange} />
                  </Grid>
                )
            )}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={6}>
            {visibleSections.includes('ProductPricing') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductPricing',
                  visibleSections,
                  replacements,
                  ProductPricing,
                  { productData: formData, onChange: handleChange }
                )}
              </Grid>
            )}
            {visibleSections.includes('ProductInventory') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductInventory',
                  visibleSections,
                  replacements,
                  ProductInventory,
                  { productData: formData, onChange: handleChange }
                )}
              </Grid>
            )}
            {visibleSections.includes('ProductOrganize') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'ProductOrganize',
                  visibleSections,
                  replacements,
                  ProductOrganize,
                  { productData: formData, onChange: handleChange }
                )}
              </Grid>
            )}
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
    </>
  )
}

