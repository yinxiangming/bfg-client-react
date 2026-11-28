'use client'

import { useLocale, useTranslations } from 'next-intl'

import { useAppDialog } from '@/contexts/AppDialogContext'
import { extensionName, getConsoleErrorCode, getConsoleErrorKeys, type ConsoleExtension } from '@/services/console'

export function useExtensionActionMessages() {
  const t = useTranslations('admin.console.extensions')
  const locale = useLocale()
  const { confirm } = useAppDialog()

  const confirmDeactivation = (extension: ConsoleExtension) => {
    const name = extensionName(extension, locale)
    return confirm(t('confirm.body', { name }), {
      title: t('confirm.title', { name }),
      confirmText: t('deactivate')
    })
  }

  const refusalMessage = (error: unknown, fallback: string, extensions: ConsoleExtension[] = []) => {
    const code = getConsoleErrorCode(error)
    if (!code || !t.has(`errors.${code}`)) return fallback

    const field = code === 'requires_inactive' ? 'requires' : code === 'required_by_active' ? 'required_by' : null
    const names = (field ? getConsoleErrorKeys(error, field) : []).map(key => {
      const extension = extensions.find(item => item.key === key)
      return extension ? extensionName(extension, locale) : key
    }).join(locale.startsWith('zh') ? '、' : ', ')

    return t(`errors.${code}`, { names })
  }

  return { confirmDeactivation, refusalMessage }
}
