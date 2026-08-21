import { resolveAccountPage } from '@/components/account/themes/resolve'
import PaymentsDefault from './PaymentsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('payments')
  const Component = Override ?? PaymentsDefault
  return <Component />
}
