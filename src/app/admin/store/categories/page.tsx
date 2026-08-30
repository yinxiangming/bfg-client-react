'use client'

// React Imports
import { useRouter } from 'next/navigation'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

// Component Imports
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CategoryTreeTable from '@/components/category/CategoryTreeTable'

// Service Imports
import { getCategories, deleteCategory, updateCategory, type Category } from '@/services/store'

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

  const handleToggleActive = async (item: Category, isActive: boolean) => {
    try {
      await updateCategory(item.id, { is_active: isActive })
    } catch (err: any) {
      alert(t('categories.page.errors.updateFailed', { error: err.message }))
      throw err
    } finally {
      // Reload either way: on success to pick up the saved row, on failure to
      // drop the switch back to what the server actually holds.
      await refetch()
    }
  }

  // The table hands over the whole renumbered sibling group. Sequential rather
  // than parallel: it is a handful of rows, and a partial failure then leaves
  // the ones already saved in a consistent prefix rather than scattered.
  const handleReorder = async (changes: Array<{ id: number; order: number }>) => {
    try {
      for (const change of changes) {
        await updateCategory(change.id, { order: change.order })
      }
    } catch (err: any) {
      alert(t('categories.page.errors.updateFailed', { error: err.message }))
    } finally {
      await refetch()
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
      <AdminPageHeader
        title={t('categories.page.title')}
        subtitle={t('categories.page.subtitle')}
        actions={
          <Button
            variant="contained"
            onClick={() => router.push('/admin/store/categories/new')}
          >
            {t('categories.page.actions.addCategory')}
          </Button>
        }
      />
      <CategoryTreeTable
        categories={categories || []}
        onActionClick={handleActionClick}
        basePath="/admin/store/categories"
        lang={locale}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
      />
    </Box>
  )
}

