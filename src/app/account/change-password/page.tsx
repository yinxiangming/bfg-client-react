import { resolveAccountPage } from '@/components/account/themes/resolve'
import ChangePasswordDefault from './ChangePasswordDefault'

export default async function Page() {
  const Override = await resolveAccountPage('change-password')
  const Component = Override ?? ChangePasswordDefault
  return <Component />
}
