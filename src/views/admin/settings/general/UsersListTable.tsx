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
import { buildUsersSchema } from '@/data/settingsSchemas'

// Service Imports
import { getUsers, getUser, createUser, updateUser, deleteUser, type User } from '@/services/settings'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { SchemaAction } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

const UsersListTable = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const usersSchema = useMemo(() => buildUsersSchema(t), [t])

  const { data: users, loading, error, refetch } = useApiData<User[]>({
    fetchFn: getUsers
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: User | {}) => {
    if (action.id === 'add') {
      setEditingUser(null)
      setDialogOpen(true)
    } else if (action.id === 'edit' && 'id' in item) {
      try {
        const user = await getUser(item.id)
        setEditingUser(user)
        setDialogOpen(true)
      } catch (err: any) {
        alert(t('settings.general.users.errors.fetchFailed', { error: err.message }))
      }
    } else if (action.id === 'delete' && 'id' in item) {
      if (await confirm(t('settings.general.users.actions.confirmDeleteWithName', { name: (item as any).username }), { danger: true })) {
        try {
          await deleteUser(item.id)
          await refetch()
        } catch (err: any) {
          alert(t('settings.general.users.errors.deleteFailed', { error: err.message }))
        }
      }
    }
  }

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data)
      } else {
        await createUser(data)
      }
      await refetch()
      setDialogOpen(false)
      setEditingUser(null)
    } catch (err: any) {
      alert(t('settings.general.users.errors.saveFailed', { error: err.message }))
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setDialogOpen(false)
    setEditingUser(null)
  }

  if (loading && (!users || users.length === 0)) {
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

  if (!usersSchema.list) {
    return <Alert severity='error'>{t('settings.general.users.errors.schemaNotFound')}</Alert>
  }

  return (
    <>
      <SchemaTable
        schema={usersSchema.list}
        data={users || []}
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
          {usersSchema.form && (
            <SchemaForm
              schema={usersSchema.form}
              initialData={editingUser || undefined}
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

export default UsersListTable
