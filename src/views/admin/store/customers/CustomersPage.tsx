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

const CJK_RE = /[\u4e00-\u9fff]/

/**
 * Name to show in the list.
 *
 * Chinese names read surname-first and unspaced (王小明), Western ones given-name
 * first. Falls back to the customer number rather than the username, because
 * legacy wxstore usernames carry a `__wxstore_<id>` suffix that is noise to a
 * human reader.
 *
 * Mirrors `User.get_full_name()` server-side (bfg/common/models/core.py); this
 * endpoint serialises `user.first_name`/`last_name` rather than a joined name,
 * so the ordering rule has to exist on both sides. Keep them in step.
 */
const customerDisplayName = (row: any): string => {
  const first = (row.user?.first_name || '').trim()
  const last = (row.user?.last_name || '').trim()

  if (first || last) {
    return CJK_RE.test(`${first}${last}`) ? `${last}${first}` : [first, last].filter(Boolean).join(' ')
  }

  return row.customer_number || '-'
}

const buildCustomersSchema = (t: any): ListSchema => ({
  title: t('customers.page.schema.title'),
  columns: [
    {
      field: 'name',
      label: t('customers.page.schema.name'),
      type: 'string',
      link: 'view',
      width: 180,
      render: (_value: any, row: any) => customerDisplayName(row)
    },
    {
      field: 'user_email',
      label: t('customers.page.schema.email'),
      type: 'string',
      sortable: true,
      width: 220,
      render: (value: any, row: any) => {
        return value || row.user?.email || '-'
      }
    },
    {
      field: 'user_phone',
      label: t('customers.page.schema.phone'),
      type: 'string',
      width: 140,
      render: (_value: any, row: any) => row.user?.phone || '-'
    },
    { field: 'total_spent', label: t('customers.page.schema.totalSpent'), type: 'currency' },
    { field: 'last_login', label: t('customers.page.schema.lastLogin'), type: 'datetime', width: 150 }
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

