'use client'

// React Imports
import { useMemo } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'

// Type Imports
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getOrders, getOrder, type Order } from '@/services/store'

type CustomerOrdersProps = {
  customerId: number
}

const buildOrdersSchema = (t: any): ListSchema => ({
  title: t('customers.orders.schema.title'),
  columns: [
    {
      field: 'order_number',
      label: t('customers.orders.schema.columns.orderNo'),
      type: 'string',
      sortable: true,
      link: 'edit',
      render: (value: any) => value || '-'
    },
    { field: 'total', label: t('customers.orders.schema.columns.total'), type: 'currency', sortable: true },
    { field: 'status', label: t('customers.orders.schema.columns.status'), type: 'select', sortable: true },
    { field: 'payment_status', label: t('customers.orders.schema.columns.paymentStatus'), type: 'select' },
    { field: 'created_at', label: t('customers.orders.schema.columns.createdAt'), type: 'datetime', sortable: true }
  ],
  searchFields: ['order_number'],
  actions: [
    { id: 'edit', label: t('customers.orders.actions.edit'), type: 'secondary', scope: 'row' }
  ]
})

const CustomerOrders = ({ customerId }: CustomerOrdersProps) => {
  const t = useTranslations('admin')
  const ordersSchema = useMemo(() => buildOrdersSchema(t), [t])

  const { data: allOrders, loading, error } = useApiData<Order[]>({
    fetchFn: getOrders
  })

  // Filter orders by customer
  const orders = useMemo(() => {
    if (!allOrders) return []
    return allOrders.filter(
      (order) => (typeof order.customer === 'object' ? (order.customer as any).id : order.customer) === customerId
    )
  }, [allOrders, customerId])

  const handleActionClick = async (action: SchemaAction, item: Order | {}) => {
    if ((action.id === 'edit' || action.id === 'view') && 'id' in item) {
      window.location.href = `/admin/store/orders/${item.id}/edit`
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
    <SchemaTable
      schema={ordersSchema}
      data={orders || []}
      onActionClick={handleActionClick}
      fetchDetailFn={(id) => getOrder(typeof id === 'string' ? parseInt(id) : id)}
      basePath='/admin/store/orders'
    />
  )
}

export default CustomerOrders
