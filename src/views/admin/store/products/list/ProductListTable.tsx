'use client'

// React Imports
import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Switch from '@mui/material/Switch'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import VariantInventoryModal from '../edit/VariantInventoryModal'
import CategoryTreeSelect from '@/components/category/CategoryTreeSelect'

// Data Imports
import { productsSchema } from '@/data/storeSchemas'
import type { SchemaResponse } from '@/types/schema'

// Service Imports
import { getProducts, deleteProduct, updateProduct, getCategoriesTree, type Product, type Category } from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

const ProductListTable = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const categoryParam = searchParams.get('category')
  const selectedCategoryId = categoryParam ? Number(categoryParam) : null

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Load categories tree
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
  }, [locale])

  // Find selected category from URL parameter
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
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
      const found = findCategory(categories, selectedCategoryId)
      setSelectedCategory(found)
    } else {
      setSelectedCategory(null)
    }
  }, [selectedCategoryId, categories])

  const { data: products, loading, error, refetch } = useApiData<Product[]>({
    fetchFn: () => getProducts(selectedCategoryId ? { category: selectedCategoryId } : undefined),
    deps: [selectedCategoryId] // Refetch when category changes
  })
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [inventoryModalProductId, setInventoryModalProductId] = useState<number | undefined>(undefined)

  // Handle category filter change
  const handleCategoryChange = (selectedCategories: Category[]) => {
    const category = selectedCategories.length > 0 ? selectedCategories[0] : null
    setSelectedCategory(category)
    
    // Update URL with category parameter
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category.id.toString())
    } else {
      params.delete('category')
    }
    // Use replace to avoid adding to history, and update immediately
    router.replace(`/admin/store/products?${params.toString()}`)
  }

  // Customize schema with product image rendering, categories, stock, and status
  const customSchema = useMemo(() => {
    if (!productsSchema.list) return productsSchema
    const schema = { ...productsSchema }
    if (schema.list) {
      schema.list = {
        ...schema.list,
        title: t('products.list.schema.title'),
        searchPlaceholder: t('products.list.schema.searchPlaceholder'),
        columns: schema.list.columns.map(col => {
          if (col.field === 'name') {
            return {
              ...col,
              label: t('products.list.schema.columns.product'),
              render: (value: any, row: any) => {
                const imageUrl = row.primary_image || '/images/placeholder.png'
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={imageUrl} 
                      alt={value}
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '4px',
                        objectFit: 'cover',
                        backgroundColor: '#f3f4f6'
                      }} 
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: 'inherit' }}>{value}</div>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                        {row.product_type || '-'}
                      </Typography>
                    </div>
                  </div>
                )
              }
            }
          }
          if (col.field === 'category_names') {
            return {
              ...col,
              label: t('products.list.columns.categories'),
              render: (value: any) => {
                if (!value || !Array.isArray(value) || value.length === 0) {
                  return <Typography variant="body2" color="text.secondary">{t('products.list.values.uncategorized')}</Typography>
                }
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {value.map((category: string, index: number) => (
                      <Chip
                        key={index}
                        label={category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                      />
                    ))}
                  </Box>
                )
              }
            }
          }
          if (col.field === 'sku') {
            return {
              ...col,
              label: t('products.list.schema.columns.sku')
            }
          }
          if (col.field === 'price') {
            return {
              ...col,
              label: t('products.list.schema.columns.price')
            }
          }
          if (col.field === 'stock_quantity') {
            return {
              ...col,
              label: t('products.list.schema.columns.qty'),
              render: (value: any, row: any) => {
                const stock = value || 0
                return (
                  <Link
                    component='button'
                    variant='body2'
                    onClick={(e) => {
                      e.stopPropagation()
                      if (row.id) {
                        setInventoryModalProductId(row.id)
                        setInventoryModalOpen(true)
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      '&:hover': {
                        color: 'primary.dark'
                      }
                    }}
                  >
                    {stock}
                  </Link>
                )
              }
            }
          }
          if (col.field === 'is_active') {
            return {
              ...col,
              label: t('products.list.schema.columns.published'),
              render: (value: any, row: any) => {
                return (
                  <Switch
                    checked={value || false}
                    size="small"
                    onChange={async (e) => {
                      e.stopPropagation()
                      try {
                        await updateProduct(row.id, { is_active: e.target.checked })
                        await refetch()
                      } catch (err: any) {
                        console.error('Failed to update product status:', err)
                        alert(t('products.list.errors.updateStatusFailed', { error: err.message }))
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )
              }
            }
          }
          return col
        }),
        filters: schema.list.filters?.map(filter => {
          if (filter.field === 'is_active') {
            return {
              ...filter,
              label: t('products.list.schema.filters.status.label'),
              options: [
                { value: 'true', label: t('products.list.schema.filters.status.published') },
                { value: 'false', label: t('products.list.schema.filters.status.inactive') }
              ]
            }
          }
          if (filter.field === 'is_featured') {
            return {
              ...filter,
              label: t('products.list.schema.filters.featured.label'),
              options: [
                { value: 'true', label: t('products.list.schema.filters.featured.yes') },
                { value: 'false', label: t('products.list.schema.filters.featured.no') }
              ]
            }
          }
          return filter
        }),
        actions: schema.list.actions?.map(action => {
          if (action.id === 'add') {
            return {
              ...action,
              label: t('products.list.schema.actions.add')
            }
          }
          if (action.id === 'edit') {
            return {
              ...action,
              label: t('products.list.schema.actions.edit')
            }
          }
          if (action.id === 'delete') {
            return {
              ...action,
              label: t('products.list.schema.actions.delete'),
              confirm: t('products.list.schema.actions.confirmDelete')
            }
          }
          return action
        })
      }
    }
    return schema
  }, [refetch, t])

  const handleActionClick = async (action: SchemaAction, item: Product | {}) => {
    if (action.id === 'add') {
      // Navigate to add page (keep existing implementation)
      router.push('/admin/store/products/add')
    } else if (action.id === 'edit' && 'id' in item) {
      // Navigate to edit page (keep existing implementation)
      router.push(`/admin/store/products/${item.id}/edit`)
    } else if (action.id === 'delete' && 'id' in item) {
      if (await confirm(t('products.list.confirmDeleteWithName', { name: (item as any).name }), { danger: true })) {
        try {
          await deleteProduct(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('products.list.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  if (loading && (!products || products.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!customSchema.list) {
    return <Alert severity='error'>{t('products.list.errors.schemaNotFound')}</Alert>
  }

  // Custom Category Filter component for SchemaTable toolbar
  const categoryFilter = (
    <>
      <Box sx={{ minWidth: 250, maxWidth: 300 }}>
        <CategoryTreeSelect
          categories={categories}
          value={selectedCategory ? [selectedCategory] : []}
          onChange={handleCategoryChange}
          label={t('products.list.filters.category.label')}
          placeholder={t('products.list.filters.category.placeholder')}
          loading={categoriesLoading}
          multiple={false}
        />
      </Box>
      {selectedCategory && (
        <Chip
          label={selectedCategory.name}
          onDelete={() => handleCategoryChange([])}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ height: '32px' }}
        />
      )}
    </>
  )

  return (
    <>
      <SchemaTable
        schema={customSchema.list}
        data={products || []}
        loading={loading}
        onActionClick={handleActionClick}
        customFilters={categoryFilter}
        statusColors={{
          true: 'success',
          false: 'error',
          Published: 'success',
          Inactive: 'error'
        }}
      />
      {inventoryModalProductId && (
        <VariantInventoryModal
          open={inventoryModalOpen}
          onClose={() => {
            setInventoryModalOpen(false)
            setInventoryModalProductId(undefined)
          }}
          productId={inventoryModalProductId}
          productData={products?.find(p => p.id === inventoryModalProductId)}
          onUpdate={() => {
            refetch()
          }}
        />
      )}
    </>
  )
}

export default ProductListTable
