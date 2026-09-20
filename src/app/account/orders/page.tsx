import { resolveAccountPage } from '@/components/account/themes/resolve'
import OrdersDefault from './OrdersDefault'

export default async function Page() {
  const Override = await resolveAccountPage('orders')
  const Component = Override ?? OrdersDefault
  return <Component />
}
