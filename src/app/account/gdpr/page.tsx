import { resolveAccountPage } from '@/components/account/themes/resolve'
import GdprDefault from './GdprDefault'

export default async function Page() {
  const Override = await resolveAccountPage('gdpr')
  const Component = Override ?? GdprDefault
  return <Component />
}
