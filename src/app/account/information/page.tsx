import { redirect } from 'next/navigation'
import { resolveAccountPage } from '@/components/account/themes/resolve'

export default async function Page() {
  const Override = await resolveAccountPage('information')
  if (Override) return <Override />
  redirect('/account/settings')
}
