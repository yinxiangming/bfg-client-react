// Server Component — mobile admin layout (UA redirect handled by middleware)
import { getTranslations } from 'next-intl/server'
import MobileAdminLayoutClient from './MobileAdminLayoutClient'

export async function generateMetadata() {
  const t = await getTranslations('admin.mobileLayout')
  return {
    title: { template: t('titleTemplate'), default: t('titleDefault') },
  }
}

export default function MobileAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MobileAdminLayoutClient>{children}</MobileAdminLayoutClient>
}
