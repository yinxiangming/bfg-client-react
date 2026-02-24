'use client'

// React Imports
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Component Imports
import SchemaForm from '@/components/schema/SchemaForm'

// Data Imports
import { storesSchema } from '@/data/storeSchemas'

// Service Imports
import { getStore, updateStore, type Store, type StorePayload } from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

export default function StoreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('admin')
  const [loading, setLoading] = useState(false)

  const { data: store, loading: fetching, error } = useApiData<Store>({
    fetchFn: () => getStore(parseInt(id)),
    deps: [id]
  })

  if (fetching) {
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

  if (!store) {
    return <Alert severity='error'>{t('stores.editPage.states.notFound')}</Alert>
  }

  if (!storesSchema.form) {
    return <Alert severity='error'>{t('stores.editPage.states.schemaNotFound')}</Alert>
  }

  const formData: Partial<Store> = {
    name: store.name,
    code: store.code,
    description: store.description,
    is_active: store.is_active !== undefined ? store.is_active : true,
    warehouses: (store as any).warehouses?.map((w: any) => w.id) || [],
    created_at: store.created_at,
    updated_at: store.updated_at
  }

  type SubmitData = Omit<Partial<StorePayload>, 'warehouses'> & {
    warehouses?: Array<number | { id: number }>
    created_at?: unknown
    updated_at?: unknown
  }

  const handleSubmit = async (data: SubmitData) => {
    setLoading(true)
    try {
      const { warehouses, created_at, updated_at, ...rest } = data
      const payload: Partial<StorePayload> = { ...rest }

      // Normalize warehouses to number[] for API
      if (Array.isArray(warehouses)) {
        payload.warehouses = warehouses
          .map(w => (typeof w === 'number' ? w : w?.id))
          .filter((w): w is number => typeof w === 'number' && Number.isFinite(w))
      }

      await updateStore(parseInt(id), payload)
      alert(t('stores.editPage.snackbar.saved'))
      router.push(`/admin/store/stores`)
    } catch (error) {
      console.error('Failed to update store', error)
      alert(t('stores.editPage.snackbar.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/store/stores`)
  }

  return (
    <SchemaForm
      schema={storesSchema.form}
      initialData={formData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  )
}

