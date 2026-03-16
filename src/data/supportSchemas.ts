// Support ticket schemas (bfg-schema)
import type { ListSchema, FormSchema, SchemaResponse } from '@/types/schema'
import { bfgApi } from '@/utils/api'
import type { SupportOptions } from '@/services/support'

type SupportTranslation = (key: string) => string

/** Build tickets list + form schema with i18n. Pass supportOptions so form category/priority/status use API options. */
export function buildTicketsSchema(t: SupportTranslation, supportOptions: SupportOptions | null): SchemaResponse {
  const statusOptions = supportOptions?.ticket_statuses ?? []
  const priorityOptions = supportOptions?.ticket_priorities ?? []
  const categoryOptions = supportOptions?.ticket_categories ?? []

  const list: ListSchema = {
    title: t('support.tickets.page.title'),
    columns: [
      { field: 'ticket_number', label: t('support.tickets.schema.columns.ticketNumber'), type: 'string', sortable: true, link: 'edit' },
      { field: 'subject', label: t('support.tickets.schema.columns.subject'), type: 'string', sortable: true },
      { field: 'customer_name', label: t('support.tickets.schema.columns.customer'), type: 'string', sortable: true },
      { field: 'priority_name', label: t('support.tickets.schema.columns.priority'), type: 'string', sortable: true },
      { field: 'status', label: t('support.tickets.schema.columns.status'), type: 'select', sortable: true, options: statusOptions },
      { field: 'assigned_to_name', label: t('support.tickets.schema.columns.assignedTo'), type: 'string' },
      { field: 'created_at', label: t('support.tickets.schema.columns.createdAt'), type: 'datetime', sortable: true }
    ],
    filters: [
      { field: 'status', label: t('support.tickets.schema.filters.status'), type: 'select', options: statusOptions, filterMode: 'api' },
      {
        field: 'priority',
        label: t('support.tickets.schema.filters.priority'),
        type: 'select',
        options: priorityOptions.map((p) => ({ value: p.label, label: p.label })),
        filterMode: 'api'
      }
    ],
    searchFields: ['ticket_number', 'subject', 'customer_name'],
    actions: [
      { id: 'add', label: t('support.tickets.schema.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'edit', label: t('support.tickets.schema.actions.edit'), type: 'secondary', scope: 'row', icon: 'tabler-edit' },
      { id: 'delete', label: t('support.tickets.schema.actions.delete'), type: 'danger', scope: 'row', icon: 'tabler-trash', confirm: t('support.tickets.schema.actions.confirmDelete') }
    ]
  }

  const form: FormSchema = {
    title: t('support.tickets.form.title'),
    fields: [
      { field: 'ticket_number', label: t('support.tickets.form.fields.ticketNumber'), type: 'string', readonly: true },
      { field: 'subject', label: t('support.tickets.form.fields.subject'), type: 'string', required: true },
      { field: 'description', label: t('support.tickets.form.fields.description'), type: 'textarea', required: true, rows: 4 },
      {
        field: 'customer',
        label: t('support.tickets.form.fields.customer'),
        type: 'select',
        required: true,
        optionsSource: 'api',
        optionsApi: bfgApi.customers(),
        optionsValueField: 'id',
        optionsLabelField: 'name',
        searchable: true,
        searchParam: 'q'
      },
      {
        field: 'category',
        label: t('support.tickets.form.fields.category'),
        type: 'select',
        options: categoryOptions.map((c) => ({ value: c.value, label: c.label }))
      },
      {
        field: 'priority',
        label: t('support.tickets.form.fields.priority'),
        type: 'select',
        options: priorityOptions.map((p) => ({ value: p.value, label: p.label }))
      },
      {
        field: 'status',
        label: t('support.tickets.form.fields.status'),
        type: 'select',
        required: true,
        options: statusOptions
      },
      {
        field: 'assigned_to',
        label: t('support.tickets.form.fields.assignedTo'),
        type: 'select',
        optionsSource: 'api',
        optionsApi: bfgApi.users(),
        optionsValueField: 'id',
        optionsLabelField: 'username',
        optionsAllowEmpty: true
      },
      {
        field: 'channel',
        label: t('support.tickets.form.fields.channel'),
        type: 'select',
        options: [
          { value: 'email', label: t('support.tickets.form.fields.channelEmail') },
          { value: 'web', label: t('support.tickets.form.fields.channelWeb') },
          { value: 'phone', label: t('support.tickets.form.fields.channelPhone') },
          { value: 'chat', label: t('support.tickets.form.fields.channelChat') },
          { value: 'social', label: t('support.tickets.form.fields.channelSocial') }
        ]
      },
      { field: 'created_at', label: t('support.tickets.form.fields.createdAt'), type: 'datetime', readonly: true, format: 'datetime' },
      { field: 'updated_at', label: t('support.tickets.form.fields.updatedAt'), type: 'datetime', readonly: true, format: 'datetime' }
    ],
    actions: [
      { id: 'submit', label: t('support.tickets.form.actions.save'), type: 'submit' },
      { id: 'cancel', label: t('support.tickets.form.actions.cancel'), type: 'cancel' }
    ]
  }

  return { list, form }
}

/** Ticket categories (settings support tab) list + form schema */
export function buildTicketCategoriesSchema(t: SupportTranslation): SchemaResponse {
  const list: ListSchema = {
    title: t('settings.support.categoriesTab.schemaTitle'),
    columns: [
      { field: 'name', label: t('settings.support.categoriesTab.columns.name'), type: 'string', sortable: true, link: 'edit' },
      { field: 'description', label: t('settings.support.categoriesTab.columns.description'), type: 'string' },
      { field: 'order', label: t('settings.support.categoriesTab.columns.order'), type: 'number', sortable: true },
      { field: 'is_active', label: t('settings.support.categoriesTab.columns.status'), type: 'boolean', sortable: true }
    ],
    searchFields: ['name'],
    actions: [
      { id: 'add', label: t('settings.support.categoriesTab.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'edit', label: t('settings.support.categoriesTab.actions.edit'), type: 'secondary', scope: 'row', icon: 'tabler-edit' },
      { id: 'delete', label: t('settings.support.categoriesTab.actions.delete'), type: 'danger', scope: 'row', icon: 'tabler-trash', confirm: t('settings.support.categoriesTab.actions.confirmDelete') }
    ]
  }
  const form: FormSchema = {
    title: t('settings.support.categoriesTab.form.title'),
    fields: [
      { field: 'name', label: t('settings.support.categoriesTab.form.fields.name'), type: 'string', required: true },
      { field: 'description', label: t('settings.support.categoriesTab.form.fields.description'), type: 'textarea', rows: 3 },
      { field: 'order', label: t('settings.support.categoriesTab.form.fields.order'), type: 'number', defaultValue: 100 },
      { field: 'is_active', label: t('settings.support.categoriesTab.form.fields.active'), type: 'boolean', defaultValue: true, newline: true }
    ],
    actions: [
      { id: 'submit', label: t('settings.support.categoriesTab.form.actions.save'), type: 'submit' },
      { id: 'cancel', label: t('common.actions.cancel'), type: 'cancel' }
    ]
  }
  return { list, form }
}

/** Ticket priorities (settings support tab) list + form schema */
export function buildTicketPrioritiesSchema(t: SupportTranslation): SchemaResponse {
  const list: ListSchema = {
    title: t('settings.support.prioritiesTab.schemaTitle'),
    columns: [
      { field: 'name', label: t('settings.support.prioritiesTab.columns.name'), type: 'string', sortable: true, link: 'edit' },
      { field: 'level', label: t('settings.support.prioritiesTab.columns.level'), type: 'number', sortable: true },
      { field: 'color', label: t('settings.support.prioritiesTab.columns.color'), type: 'color' },
      { field: 'response_time_hours', label: t('settings.support.prioritiesTab.columns.responseTime'), type: 'number' },
      { field: 'resolution_time_hours', label: t('settings.support.prioritiesTab.columns.resolutionTime'), type: 'number' },
      { field: 'is_active', label: t('settings.support.prioritiesTab.columns.status'), type: 'boolean', sortable: true }
    ],
    searchFields: ['name'],
    actions: [
      { id: 'add', label: t('settings.support.prioritiesTab.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'edit', label: t('settings.support.prioritiesTab.actions.edit'), type: 'secondary', scope: 'row', icon: 'tabler-edit' },
      { id: 'delete', label: t('settings.support.prioritiesTab.actions.delete'), type: 'danger', scope: 'row', icon: 'tabler-trash', confirm: t('settings.support.prioritiesTab.actions.confirmDelete') }
    ]
  }
  const form: FormSchema = {
    title: t('settings.support.prioritiesTab.form.title'),
    fields: [
      { field: 'name', label: t('settings.support.prioritiesTab.form.fields.name'), type: 'string', required: true },
      { field: 'level', label: t('settings.support.prioritiesTab.form.fields.level'), type: 'number', required: true, helperText: t('settings.support.prioritiesTab.form.fields.levelHelp') },
      { field: 'color', label: t('settings.support.prioritiesTab.form.fields.color'), type: 'color' },
      { field: 'response_time_hours', label: t('settings.support.prioritiesTab.form.fields.responseTime'), type: 'number' },
      { field: 'resolution_time_hours', label: t('settings.support.prioritiesTab.form.fields.resolutionTime'), type: 'number' },
      { field: 'is_active', label: t('settings.support.prioritiesTab.form.fields.active'), type: 'boolean', defaultValue: true, newline: true }
    ],
    actions: [
      { id: 'submit', label: t('settings.support.prioritiesTab.form.actions.save'), type: 'submit' },
      { id: 'cancel', label: t('common.actions.cancel'), type: 'cancel' }
    ]
  }
  return { list, form }
}
