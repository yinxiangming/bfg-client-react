'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getCustomers, getCustomer, deleteCustomer, type Customer } from '@/services/store'
import { useAppDialog } from '@/contexts/AppDialogContext'

const buildCustomersSchema = (t: any): ListSchema => ({
  title: t('customers.page.schema.title'),
  columns: [
    { field: 'customer_number', label: t('customers.page.schema.customerNumber'), type: 'string', link: 'view' },
    { field: 'company_name', label: t('customers.page.schema.companyName'), type: 'string', sortable: true },
    {
      field: 'user_email',
      label: t('customers.page.schema.email'),
      type: 'string',
      sortable: true,
      render: (value: any, row: any) => {
        return value || row.user?.email || '-'
      }
    },
    { field: 'tax_number', label: t('customers.page.schema.taxNumber'), type: 'string' },
    { field: 'credit_limit', label: t('customers.page.schema.creditLimit'), type: 'currency', sortable: true },
    { field: 'balance', label: t('customers.page.schema.balance'), type: 'currency', sortable: true },
    { field: 'is_active', label: t('customers.page.schema.active'), type: 'select', sortable: true },
    { field: 'is_verified', label: t('customers.page.schema.verified'), type: 'select', sortable: true },
    { field: 'created_at', label: t('customers.page.schema.createdAt'), type: 'datetime', sortable: true }
  ],
  searchFields: ['company_name', 'tax_number', 'user_email', 'customer_number'],
  actions: [
    { id: 'add', label: t('customers.page.actions.addCustomer'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'view', label: t('customers.page.actions.view'), type: 'secondary', scope: 'row' },
    { id: 'delete', label: t('customers.page.actions.delete'), type: 'danger', scope: 'row' }
  ]
})

export default function CustomersPage() {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const customersSchema = buildCustomersSchema(t)
  
  const { data: customers, loading, error, refetch } = useApiData<Customer[]>({
    fetchFn: getCustomers
  })

  const handleActionClick = async (action: SchemaAction, item: Customer | {}) => {
    if (action.id === 'delete' && 'id' in item) {
      const customerName = item.company_name || item.user_email || t('customers.page.actions.confirmDelete')
      if (await confirm(t('customers.page.actions.confirmDeleteCustomer', { name: customerName }), { danger: true })) {
        try {
          await deleteCustomer(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('customers.page.actions.deleteFailed', { error: err.message }))
        }
      }
    } else if ((action.id === 'edit' || action.id === 'view') && 'id' in item) {
      window.location.href = `/admin/store/customers/${item.id}${action.id === 'edit' ? '/edit' : ''}`
    } else if (action.id === 'add') {
      window.location.href = '/admin/store/customers/new'
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
      <Typography variant='h4' sx={{ mb: 4 }}>
        {t('customers.page.title')}
      </Typography>
      <SchemaTable
        schema={customersSchema}
        data={customers || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCustomer(typeof id === 'string' ? parseInt(id) : id)}
        basePath='/admin/store/customers'
      />
    </Box>
  )
}

