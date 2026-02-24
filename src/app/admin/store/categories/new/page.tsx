'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Component Imports
import SchemaForm from '@/components/schema/SchemaForm'
import CategoryTreeSelect from '@/components/category/CategoryTreeSelect'

// Data Imports
import { categoriesSchema } from '@/data/storeSchemas'
import type { FormSchema } from '@/types/schema'

// Service Imports
import { createCategory, getCategoriesTree, type CategoryPayload, type Category } from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Extension Hooks
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { renderSection } from '@/extensions/hooks/renderSection'

export default function CategoryNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const parentId = searchParams.get('parent') ? Number(searchParams.get('parent')) : null
  
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const { visibleSections, beforeSections, afterSections, replacements } =
    usePageSections('admin/store/categories/new')

  // Load categories tree for parent selection
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const categoriesData = await getCategoriesTree(locale)
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error('Failed to load categories:', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  // Find parent category from URL parameter
  const parentCategory = useMemo(() => {
    if (!parentId || !categories.length) return null

    const findCategory = (cats: Category[], id: number): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, id)
          if (found) return found
        }
      }
      return null
    }

    return findCategory(categories, parentId)
  }, [parentId, categories])

  const categoryFormSchema = useMemo((): FormSchema => {
    const base = categoriesSchema.form!
    return {
      ...base,
      title: t('categories.form.title'),
      fields: base.fields?.map(f => {
        const key = f.field
        const out = { ...f, label: t(`categories.form.fields.${key}.label`) }
        if (key === 'parent' || key === 'icon') {
          (out as any).placeholder = t(`categories.form.fields.${key}.placeholder`)
        }
        if (key === 'icon') {
          (out as any).helperText = t(`categories.form.fields.${key}.helperText`)
        }
        if (f.validation?.message !== undefined) {
          (out as any).validation = { ...f.validation, message: t(`categories.form.fields.${key}.validationMessage`) }
        }
        return out
      }),
      actions: base.actions?.map(a => ({ ...a, label: t(`categories.form.actions.${a.id}`) }))
    }
  }, [t])

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      // Generate slug from name if not provided
      if (!data.slug && data.name) {
        data.slug = data.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      // Ensure language is set
      if (!data.language) {
        data.language = locale
      }

      // Ensure order is set (default 100 per server model)
      if (data.order === undefined) {
        data.order = 100
      }

      // Ensure is_active is set
      if (data.is_active === undefined) {
        data.is_active = true
      }

      // Convert parent Category object to ID if needed
      const submitData = { ...data }
      if (submitData.parent) {
        if (typeof submitData.parent === 'object' && submitData.parent.id) {
          submitData.parent = submitData.parent.id
        } else if (Array.isArray(submitData.parent) && submitData.parent.length > 0) {
          // If it's an array (from CategoryTreeSelect), take the first one's ID
          submitData.parent = submitData.parent[0]?.id || null
        }
      } else {
        submitData.parent = null
      }

      // Server API expects 'parent' field for ProductCategory
      const response = await createCategory(submitData as CategoryPayload)
      setSnackbar({ open: true, message: t('categories.newPage.snackbar.created'), severity: 'success' })
      
      // Redirect to categories list after successful creation
      setTimeout(() => {
        router.push('/admin/store/categories')
      }, 1000)
    } catch (error: any) {
      console.error('Failed to create category', error)
      setSnackbar({ open: true, message: error.message || t('categories.newPage.snackbar.createFailed'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/store/categories')
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Prepare initial data with parent if provided
  const initialData = useMemo(() => {
    const data: any = {
      language: locale,
      is_active: true,
      order: 100
    }
    if (parentCategory) {
      data.parent = parentCategory
    }
    return data
  }, [parentCategory])

  // Custom field renderer for parent category
  const customFieldRenderer = (field: any, value: any, onChange: (value: any) => void, error?: string) => {
    if (field.field === 'parent') {
      // For single select mode, pass the value directly (not as array)
      let normalizedValue: Category | null = null
      if (value) {
        if (Array.isArray(value)) {
          normalizedValue = value.length > 0 ? value[0] : null
        } else if (typeof value === 'object' && value.id) {
          normalizedValue = value
        } else if (typeof value === 'number') {
          // If value is just an ID, find the category object from categories
          const findCategoryById = (cats: Category[], id: number): Category | null => {
            for (const cat of cats) {
              if (cat.id === id) return cat
              if (cat.children && cat.children.length > 0) {
                const found = findCategoryById(cat.children, id)
                if (found) return found
              }
            }
            return null
          }
          normalizedValue = findCategoryById(categories, value)
        }
      }
      
      return (
        <CategoryTreeSelect
          categories={categories}
          value={normalizedValue}
          onChange={(selectedCategories) => {
            const parentCategory = selectedCategories.length > 0 ? selectedCategories[0] : null
            onChange(parentCategory)
          }}
          label={t('categories.form.fields.parent.label')}
          placeholder={t('categories.form.fields.parent.placeholder')}
          loading={categoriesLoading}
          multiple={false}
        />
      )
    }
    return null
  }

  const CategoryInfoContent = () => (
    <Card>
      <CardContent>
        <SchemaForm
          schema={categoryFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          customFieldRenderer={customFieldRenderer}
        />
      </CardContent>
    </Card>
  )

  return (
    <>
      <Box>
        <Typography variant='h4' sx={{ mb: 4 }}>
          {parentCategory
            ? t('categories.newPage.titleWithParent', { name: parentCategory.name })
            : t('categories.newPage.title')}
        </Typography>
        {beforeSections.map(
          ext =>
            ext.component && (
              <Box key={ext.id} sx={{ mb: 4 }}>
                <ext.component />
              </Box>
            )
        )}
        {visibleSections.includes('CategoryInfo') &&
          renderSection(
            'CategoryInfo',
            visibleSections,
            replacements,
            CategoryInfoContent,
            undefined
          )}
        {afterSections.map(
          ext =>
            ext.component && (
              <Box key={ext.id} sx={{ mt: 4 }}>
                <ext.component />
              </Box>
            )
        )}
      </Box>

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
