import { resolveAccountPage } from '@/components/account/themes/resolve'
import CreditSlipsDefault from './CreditSlipsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('credit-slips')
  const Component = Override ?? CreditSlipsDefault
  return <Component />
}
