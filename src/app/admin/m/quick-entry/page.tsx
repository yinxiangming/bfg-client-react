import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import QuickEntryHub from '@/views/admin/mobile/QuickEntryHub'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.mobileAdmin.quickEntry')
  return { title: t('title') }
}

export default function QuickEntryPage() {
  return <QuickEntryHub />
}
