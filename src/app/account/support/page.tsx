import { resolveAccountPage } from '@/components/account/themes/resolve'
import SupportDefault from './SupportDefault'

export default async function Page() {
  const Override = await resolveAccountPage('support')
  const Component = Override ?? SupportDefault
  return <Component />
}
