'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

// Component Imports
import SchemaForm from '@/components/schema/SchemaForm'
import CategoryTreeSelect from '@/components/category/CategoryTreeSelect'
import CategoryRulesEditor from '@/components/category/CategoryRulesEditor'

// Data Imports
import { categoriesSchema } from '@/data/storeSchemas'
import type { FormSchema } from '@/types/schema'

// Service Imports
import {
  getCategory,
  updateCategory,
  getCategoryRulesSchema,
  getCategoriesTree,
  type Category,
  type CategoryPayload
} from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Extension Hooks
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { renderSection } from '@/extensions/hooks/renderSection'

export default function CategoryEditPage() {
  const router = useRouter()
  const params = useParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const categoryId = params?.id ? Number(params.id) : null

  const { data: category, loading: fetching, error, refetch } = useApiData<Category>({
    fetchFn: () => {
      if (!categoryId) throw new Error('Category ID is required')
      return getCategory(categoryId)
    },
    enabled: !!categoryId
  })

  const { data: rulesSchema, loading: rulesSchemaLoading } = useApiData<Awaited<ReturnType<typeof getCategoryRulesSchema>>>({
    fetchFn: getCategoryRulesSchema,
    enabled: !!category
  })

  // Load categories tree for parent selection
  useEffect(() => {
    const loadCategories = async () => {
      if (!category) return
      
      try {
        setCategoriesLoading(true)
        const lang = category.language || locale
        const categoriesData = await getCategoriesTree(lang)
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error('Failed to load categories:', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [category])

  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  const { visibleSections, beforeSections, afterSections, replacements } =
    usePageSections('admin/store/categories/edit')

  // Filter out current category and its descendants to prevent circular references
  // Must be called before any conditional returns (React Hooks rule)
  const availableCategories = useMemo(() => {
    if (!categoryId || !categories.length) return categories

    const filterCategory = (cats: Category[]): Category[] => {
      return cats
        .filter(cat => cat.id !== categoryId)
        .map(cat => {
          if (cat.children && cat.children.length > 0) {
            return {
              ...cat,
              children: filterCategory(cat.children)
            }
          }
          return cat
        })
    }

    return filterCategory(categories)
  }, [categories, categoryId])

  // Find parent category object from categories tree
  // Must be called before any conditional returns (React Hooks rule)
  const parentCategory = useMemo(() => {
    if (!category?.parent || !categories.length) return null

    const findCategory = (cats: Category[], parentId: number): Category | null => {
      for (const cat of cats) {
        if (cat.id === parentId) {
          return cat
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, parentId)
          if (found) return found
        }
      }
      return null
    }

    // API returns parent as an ID (number) or null
    const parentId = typeof category.parent === 'number' ? category.parent : null
    if (!parentId) return null
    return findCategory(categories, parentId)
  }, [category?.parent, categories])

  const rulesInitialData = useMemo(() => {
    const r = category?.rules as unknown
    if (r == null) return { rules: '[]' }
    if (typeof r === 'string') return { rules: (r as string).trim() || '[]' }
    return { rules: JSON.stringify(r, null, 2) }
  }, [category?.rules])

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
    if (!categoryId) return

    setSaving(true)
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
      await updateCategory(categoryId, submitData as CategoryPayload)
      setSnackbar({ open: true, message: t('categories.editPage.snackbar.updated'), severity: 'success' })
      
      // Refresh data
      await refetch()
    } catch (error: any) {
      console.error('Failed to update category', error)
      setSnackbar({ open: true, message: error.message || t('categories.editPage.snackbar.updateFailed'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/store/categories')
  }

  const handleConfigSubmit = async (data: { rules?: string }) => {
    if (!categoryId) return
    setSavingConfig(true)
    try {
      let rules: Category['rules'] = []
      const raw = (data.rules ?? '').trim() || '[]'
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) rules = parsed
      } catch {
        setSnackbar({
          open: true,
          message: t('categories.editPage.config.invalidJson'),
          severity: 'error'
        })
        return
      }
      await updateCategory(categoryId, { rules })
      setSnackbar({
        open: true,
        message: t('categories.editPage.config.snackbar.updated'),
        severity: 'success'
      })
      await refetch()
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('categories.editPage.config.snackbar.updateFailed'),
        severity: 'error'
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (!categoryId) {
    return (
      <Box>
        <Alert severity='error'>{t('categories.editPage.states.invalidId')}</Alert>
      </Box>
    )
  }

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <CircularProgress />
        <Typography variant='body2' color='text.secondary'>
          {t('categories.editPage.states.loading')}
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {t('categories.editPage.states.loadError')}: {error}
        </Alert>
      </Box>
    )
  }

  if (!category) {
    return (
      <Box>
        <Alert severity='error'>{t('categories.editPage.states.notFound')}</Alert>
      </Box>
    )
  }

  // Prepare initial data
  // Note: Server API uses 'parent' field for ProductCategory
  const initialData: any = {
    name: category.name,
    slug: category.slug,
    parent: parentCategory || undefined,
    description: category.description,
    icon: category.icon,
    order: category.order,
    is_active: category.is_active,
    language: category.language
  }

  // Custom field renderer for parent category
  const customFieldRenderer = (field: any, value: any, onChange: (value: any) => void, error?: string) => {
    if (field.field === 'parent') {
      // For single select mode, pass the value directly (not as array)
      // If value is an array, take the first element; otherwise use the value as-is
      // Ensure the value has an id property to match with options
      let normalizedValue: Category | null = null
      if (value) {
        if (Array.isArray(value)) {
          normalizedValue = value.length > 0 ? value[0] : null
        } else if (typeof value === 'object' && value.id) {
          normalizedValue = value
        } else if (typeof value === 'number') {
          // If value is just an ID, find the category object from availableCategories
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
          normalizedValue = findCategoryById(availableCategories, value)
        }
      }
      
      return (
        <CategoryTreeSelect
          categories={availableCategories}
          value={normalizedValue}
          onChange={(selectedCategories) => {
            // CategoryTreeSelect always returns array, but we only need one parent
            // Extract the first category or null
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
          loading={saving}
          customFieldRenderer={customFieldRenderer}
        />
      </CardContent>
    </Card>
  )

  const tabLabels = {
    info: t('categories.editPage.tabs.info'),
    rules: t('categories.editPage.tabs.rules')
  }

  return (
    <>
      <Box>
        <Typography variant='h4' sx={{ mb: 4 }}>
          {t('categories.editPage.title')}
        </Typography>
        {beforeSections.map(
          ext =>
            ext.component && (
              <Box key={ext.id} sx={{ mb: 4 }}>
                <ext.component />
              </Box>
            )
        )}
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v as number)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label={tabLabels.info} id='category-tab-info' aria-controls='category-tabpanel-info' />
          <Tab label={tabLabels.rules} id='category-tab-rules' aria-controls='category-tabpanel-rules' />
        </Tabs>
        {tabIndex === 0 && visibleSections.includes('CategoryInfo') &&
          renderSection(
            'CategoryInfo',
            visibleSections,
            replacements,
            CategoryInfoContent,
            undefined
          )}
        {tabIndex === 1 && (
          <>
            <Alert severity='info' sx={{ mb: 3 }}>
              <Typography variant='subtitle2' component='span' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                {t('categories.editPage.config.usageTitle')}
              </Typography>
              <Typography variant='body2' component='span' color='text.secondary'>
                {t('categories.editPage.config.usageBody')}
              </Typography>
            </Alert>
            {rulesSchema ? (
              <Card>
                <CardContent>
                  <SchemaForm
                    schema={{ ...rulesSchema, title: t('categories.editPage.tabs.rules') }}
                    initialData={rulesInitialData}
                    onSubmit={handleConfigSubmit}
                    onCancel={() => {}}
                    loading={savingConfig}
                    customFieldRenderer={(field, value, onChange, fieldError) =>
                      field.field === 'rules' ? (
                        <CategoryRulesEditor
                          value={value}
                          onChange={v => onChange(v)}
                          error={fieldError}
                          disabled={savingConfig}
                        />
                      ) : null
                    }
                  />
                </CardContent>
              </Card>
            ) : rulesSchemaLoading ? (
              <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </CardContent>
              </Card>
            ) : null}
          </>
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
