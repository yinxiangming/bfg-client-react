'use client'

// React Imports
import { useCallback, useEffect, useMemo, useState } from 'react'

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
import StatusBadge from '@/components/schema/StatusBadge'
import InviteStaffDialog, {
  INVITATION_STATUS_COLOR,
  type Invitation,
  type StaffRole
} from './InviteStaffDialog'

// Data Imports
import { buildUsersSchema } from '@/data/settingsSchemas'

// Service Imports
import { getUsers, getUser, createUser, updateUser, deleteUser, type User } from '@/services/settings'

// Util Imports
import { apiFetch, bfgApi } from '@/utils/api'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// Type Imports
import type { ListSchema, SchemaAction, SchemaColumn } from '@/types/schema'
import { useAppDialog } from '@/contexts/AppDialogContext'

type Row = { id: string | number } & Record<string, any>

// Manageable invitation states (resend / revoke apply only to these).
const MANAGEABLE = new Set(['pending', 'expired'])

// Tonal color for every state shown in the unified Status column.
const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  inactive: 'default',
  ...INVITATION_STATUS_COLOR
}

const isInvite = (row: Row) => row?.__kind === 'invitation'

const UsersListTable = () => {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()

  // --- Data: registered users + outstanding staff invitations ---------------
  const { data: users, loading, error, refetch } = useApiData<User[]>({ fetchFn: getUsers })

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [inviteError, setInviteError] = useState('')
  const [busyUuid, setBusyUuid] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    try {
      const [invData, roleData] = await Promise.all([
        apiFetch<{ results: Invitation[] } | Invitation[]>(bfgApi.staffInvitations()),
        apiFetch<{ results: StaffRole[] } | StaffRole[]>(bfgApi.staffRoles())
      ])
      setInvitations(Array.isArray(invData) ? invData : invData.results ?? [])
      setRoles(Array.isArray(roleData) ? roleData : roleData.results ?? [])
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t('staff.invitations.loadFailed'))
    }
  }, [t])

  useEffect(() => {
    loadInvites()
  }, [loadInvites])

  // Merge users and (non-accepted) invitations into one row set. Accepted
  // invitations are dropped — those people already appear as real users.
  const rows = useMemo<Row[]>(() => {
    const userRows: Row[] = (users || []).map(u => ({
      ...u,
      __kind: 'user',
      status: u.is_active ? 'active' : 'inactive'
    }))
    const inviteRows: Row[] = invitations
      .filter(inv => inv.status !== 'accepted')
      .map(inv => ({
        id: `inv-${inv.uuid}`,
        __kind: 'invitation',
        uuid: inv.uuid,
        username: '',
        first_name: '',
        last_name: '',
        email: inv.email,
        is_staff: true,
        is_superuser: false,
        roleName: inv.role?.name,
        status: inv.status,
        last_login: null
      }))
    return [...userRows, ...inviteRows]
  }, [users, invitations])

  // --- Forms / dialogs -------------------------------------------------------
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const baseSchema = useMemo(() => buildUsersSchema(t), [t])

  const statusLabel = useCallback(
    (status: string) => {
      if (status === 'active') return t('settings.general.users.filters.status.options.active')
      if (status === 'inactive') return t('settings.general.users.filters.status.options.inactive')
      return t(`staff.invitations.status.${status}`)
    },
    [t]
  )

  // Build the list schema: reuse the base columns/labels, but make the User /
  // Role / Status / Last-login columns invitation-aware and add invite + resend
  // + revoke actions alongside the existing add / edit / delete.
  const listSchema = useMemo<ListSchema | undefined>(() => {
    if (!baseSchema.list) return undefined

    const columns: SchemaColumn[] = baseSchema.list.columns.map(col => {
      if (col.field === 'username') {
        return {
          ...col,
          render: (value: any, row: any) =>
            isInvite(row)
              ? '—'
              : row.first_name && row.last_name
                ? `${row.first_name} ${row.last_name}`
                : value
        }
      }
      if (col.field === 'is_staff') {
        return {
          ...col,
          render: (value: any, row: any) => {
            if (isInvite(row)) return row.roleName ?? '—'
            if (row.is_superuser) return t('settings.general.users.schema.roleValues.superuser')
            if (row.is_staff) return t('settings.general.users.schema.roleValues.staff')
            return t('settings.general.users.schema.roleValues.user')
          }
        }
      }
      if (col.field === 'is_active') {
        return {
          field: 'status',
          label: col.label,
          type: 'string',
          sortable: true,
          render: (_value: any, row: any) => (
            <StatusBadge label={statusLabel(row.status)} color={STATUS_COLOR[row.status] || 'default'} />
          )
        }
      }
      if (col.field === 'last_login') {
        return {
          ...col,
          render: (value: any, row: any) =>
            isInvite(row) ? '—' : value || t('settings.general.users.schema.lastLoginNever')
        }
      }
      return col
    })

    // Status filter now covers user states + invitation states.
    const filters = baseSchema.list.filters?.map(f =>
      f.field === 'is_active'
        ? {
            field: 'status',
            label: f.label,
            type: 'select' as const,
            options: [
              { value: 'active', label: statusLabel('active') },
              { value: 'inactive', label: statusLabel('inactive') },
              { value: 'pending', label: statusLabel('pending') },
              { value: 'expired', label: statusLabel('expired') },
              { value: 'revoked', label: statusLabel('revoked') }
            ]
          }
        : f
    )

    const actions: SchemaAction[] = [
      ...(baseSchema.list.actions || []).map(a =>
        a.id === 'edit' || a.id === 'delete' ? { ...a, hidden: (row: any) => isInvite(row) } : a
      ),
      {
        id: 'invite',
        label: t('staff.page.invite'),
        type: 'secondary',
        scope: 'global',
        icon: 'tabler-mail-plus'
      },
      {
        id: 'resend',
        label: t('staff.invitations.resend'),
        type: 'secondary',
        scope: 'row',
        hidden: (row: any) => !(isInvite(row) && MANAGEABLE.has(row.status))
      },
      {
        id: 'revoke',
        label: t('staff.invitations.revoke'),
        type: 'danger',
        scope: 'row',
        hidden: (row: any) => !(isInvite(row) && MANAGEABLE.has(row.status))
      }
    ]

    return { ...baseSchema.list, columns, filters, actions }
  }, [baseSchema, statusLabel, t])

  // --- Actions ---------------------------------------------------------------
  const handleResend = async (uuid: string) => {
    setBusyUuid(uuid)
    try {
      const updated = await apiFetch<Invitation>(`${bfgApi.staffInvitations()}${uuid}/resend/`, { method: 'POST' })
      setInvitations(prev => prev.map(i => (i.uuid === uuid ? updated : i)))
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t('staff.invitations.resendFailed'))
    } finally {
      setBusyUuid(null)
    }
  }

  const handleRevoke = async (uuid: string, email: string) => {
    if (!(await confirm(t('staff.invitations.confirmRevoke', { email }), { danger: true }))) return
    setBusyUuid(uuid)
    try {
      await apiFetch(`${bfgApi.staffInvitations()}${uuid}/`, { method: 'DELETE' })
      setInvitations(prev => prev.map(i => (i.uuid === uuid ? { ...i, status: 'revoked' as const } : i)))
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t('staff.invitations.revokeFailed'))
    } finally {
      setBusyUuid(null)
    }
  }

  const handleActionClick = async (action: SchemaAction, item: Row) => {
    switch (action.id) {
      case 'add':
        setEditingUser(null)
        setDialogOpen(true)
        break
      case 'invite':
        setInviteOpen(true)
        break
      case 'edit':
        if ('id' in item) {
          try {
            const user = await getUser(Number(item.id))
            setEditingUser(user)
            setDialogOpen(true)
          } catch (err: any) {
            alert(t('settings.general.users.errors.fetchFailed', { error: err.message }))
          }
        }
        break
      case 'delete':
        if ('id' in item) {
          if (await confirm(t('settings.general.users.actions.confirmDeleteWithName', { name: item.username }), { danger: true })) {
            try {
              await deleteUser(Number(item.id))
              await refetch()
            } catch (err: any) {
              alert(t('settings.general.users.errors.deleteFailed', { error: err.message }))
            }
          }
        }
        break
      case 'resend':
        await handleResend(item.uuid)
        break
      case 'revoke':
        await handleRevoke(item.uuid, item.email)
        break
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

  // --- Render ----------------------------------------------------------------
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

  if (!listSchema) {
    return <Alert severity='error'>{t('settings.general.users.errors.schemaNotFound')}</Alert>
  }

  return (
    <>
      {inviteError && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setInviteError('')}>
          {inviteError}
        </Alert>
      )}

      <SchemaTable
        schema={listSchema}
        data={rows}
        loading={loading || !!busyUuid}
        onActionClick={handleActionClick}
        statusColors={STATUS_COLOR}
      />

      {/* User add / edit form */}
      <Dialog open={dialogOpen} onClose={handleFormCancel} maxWidth='md' fullWidth>
        <DialogContent>
          {baseSchema.form && (
            <SchemaForm
              schema={baseSchema.form}
              initialData={editingUser || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite staff dialog */}
      <InviteStaffDialog
        open={inviteOpen}
        roles={roles}
        onClose={() => setInviteOpen(false)}
        onInvited={invitation => {
          setInvitations(prev => [invitation, ...prev])
          setInviteOpen(false)
        }}
      />
    </>
  )
}

export default UsersListTable
