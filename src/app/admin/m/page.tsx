import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import MobileAdminHub from '@/views/admin/mobile/MobileAdminHub'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.mobileAdmin.hub')
  return { title: t('title') }
}

export default function MobileAdminPage() {
  return <MobileAdminHub />
}
