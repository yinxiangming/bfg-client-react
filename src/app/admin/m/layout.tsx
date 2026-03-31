// Server Component — mobile admin layout (UA redirect handled by middleware)
import MobileAdminLayoutClient from './MobileAdminLayoutClient'

export const metadata = {
  title: { template: '管理 - %s', default: '管理' },
}

export default function MobileAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MobileAdminLayoutClient>{children}</MobileAdminLayoutClient>
}
