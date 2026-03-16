'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'

import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  type Store,
  type StorePayload
} from '@/services/store'
import { buildStoresSchema } from '@/data/storeSchemas'

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

export default function StoresPage() {
  const t = useTranslations('admin')
  const schema = useMemo(() => buildStoresSchema(t), [t])
  const listSchema = schema.list!
  const formSchema = schema.form!

  const { data: stores, loading, error, refetch } = useApiData<Store[]>({
    fetchFn: getStores
  })

  const [editItem, setEditItem] = useState<Store | Partial<Store> | null>(null)
  const [fetchingDetail, setFetchingDetail] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: Store | {}) => {
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteStore(item.id)
        await refetch()
      } catch (err: any) {
        alert(t('stores.errors.deleteFailed', { error: err?.message ?? String(err) }))
      }
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setFetchingDetail(true)
      try {
        const full = await getStore(item.id)
        setEditItem(full)
      } catch (e) {
        alert(t('stores.errors.loadFailed'))
      } finally {
        setFetchingDetail(false)
      }
      return
    }
    if (action.id === 'view' && 'id' in item) {
      setFetchingDetail(true)
      try {
        const full = await getStore(item.id)
        setEditItem(full)
      } catch (e) {
        alert(t('stores.errors.loadFailed'))
      } finally {
        setFetchingDetail(false)
      }
      return
    }
    if (action.id === 'add') {
      setEditItem({ is_active: true })
    }
  }

  const formInitialData = useMemo(() => {
    if (!editItem) return undefined
    const hasId = 'id' in editItem && typeof (editItem as Store).id === 'number'
    const store = editItem as Store
    return {
      name: store.name ?? '',
      code: store.code ?? '',
      description: store.description ?? '',
      warehouses: pickWarehouseArray(store),
      is_active: store.is_active !== undefined ? store.is_active : true,
      ...(hasId && store.created_at && { created_at: store.created_at }),
      ...(hasId && store.updated_at && { updated_at: store.updated_at })
    }
  }, [editItem])

  const handleSubmit = async (data: Record<string, unknown>) => {
    const hasId = editItem && 'id' in editItem && typeof (editItem as Store).id === 'number'
    const payload: StorePayload = {
      name: String(data.name ?? ''),
      code: data.code ? String(data.code) : undefined,
      description: data.description ? String(data.description) : undefined,
      is_active: Boolean(data.is_active)
    }
    const rawWarehouses = data.warehouses
    if (Array.isArray(rawWarehouses)) {
      payload.warehouses = rawWarehouses
        .map((w: unknown) => toWarehouseId(w as WarehouseLike))
        .filter((w): w is number => typeof w === 'number' && Number.isFinite(w))
    }

    setSaving(true)
    try {
      if (hasId) {
        await updateStore((editItem as Store).id, payload)
      } else {
        await createStore(payload)
      }
      await refetch()
      setEditItem(null)
    } catch (err: any) {
      alert(t('stores.editPage.snackbar.saveFailed') ?? err?.message ?? String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => setEditItem(null)

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
      <Typography variant='h4' sx={{ mb: 4 }}>
        {t('stores.page.title')}
      </Typography>
      <SchemaTable
        schema={listSchema}
        data={stores ?? []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getStore(typeof id === 'string' ? parseInt(id, 10) : id)}
        basePath='/admin/store/stores'
      />

      {fetchingDetail && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {editItem !== null && !fetchingDetail && formSchema && (
        <Dialog open onClose={handleCancel} maxWidth='md' fullWidth>
          <DialogContent
            sx={{
              p: 0,
              '& .MuiCard-root': { boxShadow: 'none' },
              '& .MuiCardContent-root': { p: 4 }
            }}
          >
            <SchemaForm
              schema={formSchema}
              initialData={formInitialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}
