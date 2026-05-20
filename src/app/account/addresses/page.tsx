import { resolveAccountPage } from '@/components/account/themes/resolve'
import AddressesDefault from './AddressesDefault'

export default async function Page() {
  const Override = await resolveAccountPage('addresses')
  const Component = Override ?? AddressesDefault
  return <Component />
}
