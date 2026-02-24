// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { ProductType } from '@/types/store'
import type { Category } from '@/services/store'
import { getCategoriesTree } from '@/services/store'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

const TableFilters = ({
  setData,
  productData
}: {
  setData: (data: ProductType[]) => void
  productData?: ProductType[]
}) => {
  const locale = useLocale()
  const t = useTranslations('admin')

  // States
  const [category, setCategory] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [stock, setStock] = useState<string>('') // '' | 'in_stock' | 'out_of_stock'
  const [status, setStatus] = useState<string>('') // '' | 'published' | 'inactive'

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const categoriesData = await getCategoriesTree(locale)
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Failed to load categories', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [locale])

  // Flatten category tree to get all categories
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    cats.forEach(cat => {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children))
      }
    })
    return result
  }

  useEffect(
    () => {
      const filteredData = productData?.filter(product => {
        // Filter by category
        if (selectedCategoryId) {
          // Check if product has the selected category
          // This is a simplified check - you may need to adjust based on your API response
          const productCategoryIds = (product as any).category_ids || 
            ((product as any).categories?.map((c: any) => typeof c === 'object' ? c.id : c) || [])
          
          if (!productCategoryIds.includes(selectedCategoryId)) {
            return false
          }
        } else if (category && !product.category_names?.includes(category)) {
          // Fallback to old category name filter
          return false
        }
        
        if (stock) {
          const isInStock = stock === 'in_stock'
          const productInStock = (product.stock_quantity || 0) > 0
          if (isInStock !== productInStock) return false
        }
        if (status) {
          const isActive = status === 'published'
          if (isActive !== product.is_active) return false
        }

        return true
      })

      setData(filteredData ?? [])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, selectedCategoryId, stock, status, productData]
  )

  const allCategories = flattenCategories(categories)

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>{t('products.tableFilters.status.placeholder')}</MenuItem>
            <MenuItem value='published'>{t('products.tableFilters.status.published')}</MenuItem>
            <MenuItem value='inactive'>{t('products.tableFilters.status.inactive')}</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-category'
            value={selectedCategoryId || ''}
            onChange={e => {
              const catId = e.target.value ? Number(e.target.value) : null
              setSelectedCategoryId(catId)
              if (catId) {
                const selectedCat = allCategories.find(c => c.id === catId)
                setCategory(selectedCat?.name || '')
              } else {
                setCategory('')
              }
            }}
            SelectProps={{ displayEmpty: true }}
            disabled={categoriesLoading}
          >
            <MenuItem value=''>{t('products.tableFilters.category.placeholder')}</MenuItem>
            {allCategories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-stock'
            value={stock}
            onChange={e => setStock(e.target.value as string)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>{t('products.tableFilters.stock.placeholder')}</MenuItem>
            <MenuItem value='in_stock'>{t('products.tableFilters.stock.inStock')}</MenuItem>
            <MenuItem value='out_of_stock'>{t('products.tableFilters.stock.outOfStock')}</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters

