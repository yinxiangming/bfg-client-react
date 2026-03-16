'use client'

import { use, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import SchemaForm from '@/components/schema/SchemaForm'
import { buildStoresSchema } from '@/data/storeSchemas'

// Service Imports
import { getStore, updateStore, type Store, type StorePayload } from '@/services/store'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

type WarehouseLike = number | string | { id?: number | string; value?: number | string; warehouse_id?: number | string }

function pickWarehouseArray(source: any): WarehouseLike[] {
  const candidates = [
    source?.warehouses,
    source?.warehouse_ids,
    source?.warehouseIds,
    source?.warehouse_id_list,
    source?.warehouseIdList
  ]
  const found = candidates.find(Array.isArray)
  return Array.isArray(found) ? found : []
}

function toWarehouseId(item: WarehouseLike): number | null {
  const raw =
    typeof item === 'number' || typeof item === 'string'
      ? item
      : item?.id ?? item?.value ?? item?.warehouse_id ?? null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeWarehousesForStore(source: any): { id: number; name: string }[] {
  const raw = pickWarehouseArray(source)
  return raw
    .map(item => {
      const id = toWarehouseId(item)
      const name = typeof item === 'object' && item !== null && 'name' in item ? String((item as { name?: string }).name ?? '') : ''
      return id != null ? { id, name } : null
    })
    .filter((w): w is { id: number; name: string } => w !== null && Number.isFinite(w.id))
}

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

  const formSchema = useMemo(() => buildStoresSchema(t).form, [t])
  if (!formSchema) {
    return <Alert severity='error'>{t('stores.editPage.states.schemaNotFound')}</Alert>
  }

  const formData: Partial<Store> = {
    name: store.name,
    code: store.code,
    description: store.description,
    is_active: store.is_active !== undefined ? store.is_active : true,
    warehouses: normalizeWarehousesForStore(store),
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
          .map(w => toWarehouseId(w as WarehouseLike))
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
      schema={formSchema}
      initialData={formData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  )
}

