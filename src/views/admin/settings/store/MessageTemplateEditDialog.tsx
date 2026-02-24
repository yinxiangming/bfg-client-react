'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { MessageTemplate, MessageTemplatePayload } from '@/services/messageTemplate'

type MessageTemplateEditDialogProps = {
  open: boolean
  template: MessageTemplate | null
  onClose: () => void
  onSave: (data: MessageTemplatePayload) => Promise<void> | void
}

const buildMessageTemplateFormSchema = (t: any): FormSchema => ({
  title: t('settings.store.messageTemplates.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.store.messageTemplates.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.store.messageTemplates.editDialog.fields.code'), type: 'string', required: true },
    { field: 'event', label: t('settings.store.messageTemplates.editDialog.fields.event'), type: 'string', required: true },
    {
      field: 'language',
      label: t('settings.store.messageTemplates.editDialog.fields.language'),
      type: 'select',
      required: true,
      options: [
        { value: 'en', label: t('settings.store.messageTemplates.editDialog.languageOptions.en') },
        { value: 'zh-cn', label: t('settings.store.messageTemplates.editDialog.languageOptions.zhCn') },
        { value: 'zh-tw', label: t('settings.store.messageTemplates.editDialog.languageOptions.zhTw') }
      ],
      defaultValue: 'en'
    },
    { field: 'is_active', label: t('settings.store.messageTemplates.editDialog.fields.active'), type: 'boolean', defaultValue: true },
    
    // Email settings
    { field: 'email_enabled', label: t('settings.store.messageTemplates.editDialog.fields.emailEnabled'), type: 'boolean', defaultValue: false },
    { field: 'email_subject', label: t('settings.store.messageTemplates.editDialog.fields.emailSubject'), type: 'string' },
    { field: 'email_body', label: t('settings.store.messageTemplates.editDialog.fields.emailBody'), type: 'textarea', rows: 6 },
    { field: 'email_html_body', label: t('settings.store.messageTemplates.editDialog.fields.emailHtmlBody'), type: 'textarea', rows: 6 },
    
    // App message settings
    { field: 'app_message_enabled', label: t('settings.store.messageTemplates.editDialog.fields.appMessageEnabled'), type: 'boolean', defaultValue: true },
    { field: 'app_message_title', label: t('settings.store.messageTemplates.editDialog.fields.appMessageTitle'), type: 'string' },
    { field: 'app_message_body', label: t('settings.store.messageTemplates.editDialog.fields.appMessageBody'), type: 'textarea', rows: 4 },
    
    // SMS settings
    { field: 'sms_enabled', label: t('settings.store.messageTemplates.editDialog.fields.smsEnabled'), type: 'boolean', defaultValue: false },
    { field: 'sms_body', label: t('settings.store.messageTemplates.editDialog.fields.smsBody'), type: 'textarea', rows: 3 },
    
    // Push settings
    { field: 'push_enabled', label: t('settings.store.messageTemplates.editDialog.fields.pushEnabled'), type: 'boolean', defaultValue: false },
    { field: 'push_title', label: t('settings.store.messageTemplates.editDialog.fields.pushTitle'), type: 'string' },
    { field: 'push_body', label: t('settings.store.messageTemplates.editDialog.fields.pushBody'), type: 'textarea', rows: 3 }
  ]
})

const MessageTemplateEditDialog = ({ open, template, onClose, onSave }: MessageTemplateEditDialogProps) => {
  const t = useTranslations('admin')
  const messageTemplateFormSchema = useMemo(() => buildMessageTemplateFormSchema(t), [t])

  const initialData: Partial<MessageTemplate> = template
    ? template
    : {
        name: '',
        code: '',
        event: '',
        language: 'en',
        email_enabled: false,
        email_subject: '',
        email_body: '',
        email_html_body: '',
        app_message_enabled: true,
        app_message_title: '',
        app_message_body: '',
        sms_enabled: false,
        sms_body: '',
        push_enabled: false,
        push_title: '',
        push_body: '',
        is_active: true
      }

  const handleSubmit = async (data: Partial<MessageTemplate>) => {
    const payload: MessageTemplatePayload = {
      name: data.name || '',
      code: data.code || '',
      event: data.event || '',
      language: data.language || 'en',
      email_enabled: Boolean(data.email_enabled),
      email_subject: data.email_subject || '',
      email_body: data.email_body || '',
      email_html_body: data.email_html_body || '',
      app_message_enabled: Boolean(data.app_message_enabled),
      app_message_title: data.app_message_title || '',
      app_message_body: data.app_message_body || '',
      sms_enabled: Boolean(data.sms_enabled),
      sms_body: data.sms_body || '',
      push_enabled: Boolean(data.push_enabled),
      push_title: data.push_title || '',
      push_body: data.push_body || '',
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={messageTemplateFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default MessageTemplateEditDialog
