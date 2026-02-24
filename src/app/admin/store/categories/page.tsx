'use client'

// React Imports
import { useRouter } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

// Component Imports
import CategoryTreeTable from '@/components/category/CategoryTreeTable'

// Service Imports
import { getCategories, deleteCategory, type Category } from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

export default function CategoriesPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const { data: categories, loading, error, refetch } = useApiData<Category[]>({
    fetchFn: () => getCategories(locale)
  })

  const handleActionClick = async (action: SchemaAction, item: Category | {}) => {
    if (action.id === 'delete' && 'id' in item) {
      if (await confirm(t('categories.page.actions.confirmDeleteWithName', { name: item.name }), { danger: true })) {
        try {
          await deleteCategory(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('categories.page.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  if (loading) {
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h4'>
          {t('categories.page.title')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/admin/store/categories/new')}
        >
          {t('categories.page.actions.addCategory')}
        </Button>
      </Box>
      <CategoryTreeTable
        categories={categories || []}
        onActionClick={handleActionClick}
        basePath="/admin/store/categories"
        lang={locale}
      />
    </Box>
  )
}

