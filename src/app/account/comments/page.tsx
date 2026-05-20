import { resolveAccountPage } from '@/components/account/themes/resolve'
import CommentsDefault from './CommentsDefault'

export default async function Page() {
  const Override = await resolveAccountPage('comments')
  const Component = Override ?? CommentsDefault
  return <Component />
}
