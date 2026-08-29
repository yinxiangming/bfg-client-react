'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { usePagedData } from '@/hooks/usePagedData'
import { getCustomersPage, getCustomer, deleteCustomer, type Customer } from '@/services/store'
import { useAppDialog } from '@/contexts/AppDialogContext'

const buildCustomersSchema = (t: any): ListSchema => ({
  title: t('customers.page.schema.title'),
  columns: [
    { field: 'customer_number', label: t('customers.page.schema.customerNumber'), type: 'string', link: 'view' },
    {
      // Customer has no name of its own — it comes from the linked user. Without this
      // a consumer account with no company and no email renders as a blank row.
      field: 'user',
      label: t('customers.page.schema.name'),
      type: 'string',
      render: (_value: any, row: any) => {
        const user = row.user || {}
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        return fullName || user.username || '-'
      }
    },
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
  searchFields: ['user', 'company_name', 'tax_number', 'user_email', 'customer_number'],
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
  
  const {
    items: customers,
    loading,
    error,
    serverPagination,
    onSearchChange,
    refetch,
  } = usePagedData<Customer>(getCustomersPage)

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

  if (loading && !customers) {
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
      <AdminPageHeader title={t('customers.page.title')} subtitle={t('customers.page.subtitle')} />
      <SchemaTable
        schema={customersSchema}
        data={customers || []}
        loading={loading}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCustomer(typeof id === 'string' ? parseInt(id) : id)}
        basePath='/admin/store/customers'
        serverPagination={serverPagination}
        onSearchChange={onSearchChange}
      />
    </Box>
  )
}

