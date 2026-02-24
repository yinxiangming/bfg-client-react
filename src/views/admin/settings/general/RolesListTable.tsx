'use client'

// React Imports
import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'

// Data Imports
import { buildStaffRolesSchema } from '@/data/settingsSchemas'

// Service Imports
import { 
  getStaffRoles, 
  getStaffRole, 
  createStaffRole, 
  updateStaffRole, 
  deleteStaffRole, 
  type StaffRole 
} from '@/services/settings'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

const RolesListTable = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const staffRolesSchema = useMemo(() => buildStaffRolesSchema(t), [t])

  const { data: roles, loading, error, refetch } = useApiData<StaffRole[]>({
    fetchFn: getStaffRoles
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: StaffRole | {}) => {
    if (action.id === 'add') {
      setEditingRole(null)
      setDialogOpen(true)
    } else if (action.id === 'edit' && 'id' in item) {
      try {
        const role = await getStaffRole(item.id)
        setEditingRole(role)
        setDialogOpen(true)
      } catch (err: any) {
        alert(t('settings.general.roles.errors.fetchFailed', { error: err.message }))
      }
    } else if (action.id === 'delete' && 'id' in item) {
      if (await confirm(t('settings.general.roles.actions.confirmDeleteWithName', { name: (item as any).name }), { danger: true })) {
        try {
          await deleteStaffRole(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('settings.general.roles.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true)
    try {
      if (editingRole) {
        await updateStaffRole(editingRole.id, data)
      } else {
        await createStaffRole(data)
      }
      await refetch()
      setDialogOpen(false)
      setEditingRole(null)
    } catch (err: any) {
      alert(t('settings.general.roles.errors.saveFailed', { error: err.message }))
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setDialogOpen(false)
    setEditingRole(null)
  }

  if (loading && (!roles || roles.length === 0)) {
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

  if (!staffRolesSchema.list) {
    return <Alert severity='error'>{t('settings.general.roles.errors.schemaNotFound')}</Alert>
  }

  return (
    <>
      <SchemaTable
        schema={staffRolesSchema.list}
        data={roles || []}
        loading={loading}
        onActionClick={handleActionClick}
        statusColors={{
          true: 'success',
          false: 'default',
          active: 'success',
          inactive: 'default'
        }}
      />

      {/* Form Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {staffRolesSchema.form && (
            <SchemaForm
              schema={staffRolesSchema.form}
              initialData={editingRole || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RolesListTable
