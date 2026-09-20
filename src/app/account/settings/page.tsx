import { resolveAccountPage } from '@/components/account/themes/resolve'
import SettingsDefault from './SettingsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('settings')
  const Component = Override ?? SettingsDefault
  return <Component />
}
