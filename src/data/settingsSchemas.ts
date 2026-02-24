// Settings-specific schemas
import type { SchemaResponse } from '@/types/schema'

// Users Schema (i18n via builder)
export const buildUsersSchema = (t: any): SchemaResponse => ({
  list: {
    title: t('settings.general.users.schema.title'),
    columns: [
      { 
        field: 'username', 
        label: t('settings.general.users.schema.columns.user'),
        type: 'string', 
        sortable: true,
        render: (value: any, row: any) => {
          const fullName = row.first_name && row.last_name 
            ? `${row.first_name} ${row.last_name}` 
            : value
          return fullName
        }
      },
      { field: 'email', label: t('settings.general.users.schema.columns.email'), type: 'string', sortable: true },
      { 
        field: 'is_staff', 
        label: t('settings.general.users.schema.columns.role'),
        type: 'select',
        render: (value: any, row: any) => {
          if (row.is_superuser) return t('settings.general.users.schema.roleValues.superuser')
          if (row.is_staff) return t('settings.general.users.schema.roleValues.staff')
          return t('settings.general.users.schema.roleValues.user')
        }
      },
      { 
        field: 'is_active', 
        label: t('settings.general.users.schema.columns.status'),
        type: 'select',
        sortable: true 
      },
      { 
        field: 'last_login', 
        label: t('settings.general.users.schema.columns.lastLogin'),
        type: 'datetime',
        render: (value: any) => value || t('settings.general.users.schema.lastLoginNever')
      }
    ],
    filters: [
      {
        field: 'is_active',
        label: t('settings.general.users.filters.status.label'),
        type: 'select',
        options: [
          { value: 'true', label: t('settings.general.users.filters.status.options.active') },
          { value: 'false', label: t('settings.general.users.filters.status.options.inactive') }
        ]
      },
      {
        field: 'is_staff',
        label: t('settings.general.users.filters.role.label'),
        type: 'select',
        options: [
          { value: 'true', label: t('settings.general.users.filters.role.options.staff') },
          { value: 'false', label: t('settings.general.users.filters.role.options.user') }
        ]
      }
    ],
    searchFields: ['username', 'email', 'first_name', 'last_name'],
    searchPlaceholder: t('settings.general.users.searchPlaceholder'),
    actions: [
      { 
        id: 'add', 
        label: t('settings.general.users.actions.add'),
        type: 'primary', 
        scope: 'global',
        icon: 'tabler-plus'
      },
      { id: 'edit', label: t('settings.general.users.actions.edit'), type: 'secondary', scope: 'row' },
      { 
        id: 'delete', 
        label: t('settings.general.users.actions.delete'), 
        type: 'danger', 
        scope: 'row', 
        confirm: t('settings.general.users.actions.confirmDelete') 
      }
    ]
  },
  form: {
    title: t('settings.general.users.form.title'),
    fields: [
      { field: 'username', label: t('settings.general.users.form.fields.username'), type: 'string', required: true },
      { field: 'email', label: t('settings.general.users.form.fields.email'), type: 'email', required: true },
      { field: 'first_name', label: t('settings.general.users.form.fields.firstName'), type: 'string', required: true },
      { field: 'last_name', label: t('settings.general.users.form.fields.lastName'), type: 'string', required: true },
      { field: 'phone', label: t('settings.general.users.form.fields.phone'), type: 'string' },
      { field: 'is_staff', label: t('settings.general.users.form.fields.isStaff'), type: 'boolean' },
      { field: 'is_active', label: t('settings.general.users.form.fields.isActive'), type: 'boolean' },
      { field: 'is_superuser', label: t('settings.general.users.form.fields.isSuperuser'), type: 'boolean' }
    ],
    actions: [
      { id: 'submit', label: t('settings.general.users.form.actions.save'), type: 'submit' },
      { id: 'cancel', label: t('settings.general.users.form.actions.cancel'), type: 'cancel' }
    ]
  }
})

// Staff Roles Schema (i18n via builder)
export const buildStaffRolesSchema = (t: any): SchemaResponse => ({
  list: {
    title: t('settings.general.roles.schema.title'),
    columns: [
      { 
        field: 'name', 
        label: t('settings.general.roles.schema.columns.roleName'), 
        type: 'string', 
        sortable: true 
      },
      { 
        field: 'description', 
        label: t('settings.general.roles.schema.columns.description'), 
        type: 'string',
        render: (value: any) => value || '-'
      },
      { 
        field: 'is_active', 
        label: t('settings.general.roles.schema.columns.status'), 
        type: 'select',
        sortable: true 
      },
      { 
        field: 'created_at', 
        label: t('settings.general.roles.schema.columns.createdAt'), 
        type: 'datetime',
        sortable: true 
      }
    ],
    filters: [
      {
        field: 'is_active',
        label: t('settings.general.roles.filters.status.label'),
        type: 'select',
        options: [
          { value: 'true', label: t('settings.general.roles.filters.status.options.active') },
          { value: 'false', label: t('settings.general.roles.filters.status.options.inactive') }
        ]
      }
    ],
    searchFields: ['name', 'description'],
    searchPlaceholder: t('settings.general.roles.searchPlaceholder'),
    actions: [
      { 
        id: 'add', 
        label: t('settings.general.roles.actions.add'), 
        type: 'primary', 
        scope: 'global',
        icon: 'tabler-plus'
      },
      { id: 'edit', label: t('settings.general.roles.actions.edit'), type: 'secondary', scope: 'row' },
      { 
        id: 'delete', 
        label: t('settings.general.roles.actions.delete'), 
        type: 'danger', 
        scope: 'row', 
        confirm: t('settings.general.roles.actions.confirmDelete') 
      }
    ]
  },
  form: {
    title: t('settings.general.roles.form.title'),
    fields: [
      { field: 'name', label: t('settings.general.roles.form.fields.roleName'), type: 'string', required: true },
      { field: 'description', label: t('settings.general.roles.form.fields.description'), type: 'textarea' },
      { field: 'is_active', label: t('settings.general.roles.form.fields.isActive'), type: 'boolean' }
    ],
    actions: [
      { id: 'submit', label: t('settings.general.roles.form.actions.save'), type: 'submit' },
      { id: 'cancel', label: t('settings.general.roles.form.actions.cancel'), type: 'cancel' }
    ]
  }
})

