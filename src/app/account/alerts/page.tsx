import { resolveAccountPage } from '@/components/account/themes/resolve'
import AlertsDefault from './AlertsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('alerts')
  const Component = Override ?? AlertsDefault
  return <Component />
}
