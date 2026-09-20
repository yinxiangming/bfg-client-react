import AccountDashboardClient from './AccountDashboardClient'
import { resolveAccountPage } from '@/components/account/themes/resolve'

export const metadata = { title: 'Dashboard' }

export default async function Page() {
  const Override = await resolveAccountPage('dashboard')
  const Component = Override ?? AccountDashboardClient
  return <Component />
}
