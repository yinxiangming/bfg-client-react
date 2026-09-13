import { resolveAccountPage } from '@/components/account/themes/resolve'
import ReturnsDefault from './ReturnsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('returns')
  const Component = Override ?? ReturnsDefault
  return <Component />
}
