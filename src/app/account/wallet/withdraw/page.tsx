import { resolveAccountPage } from '@/components/account/themes/resolve'
import WalletWithdrawDefault from './WalletWithdrawDefault'

export default async function Page() {
  const Override = await resolveAccountPage('wallet/withdraw')
  const Component = Override ?? WalletWithdrawDefault
  return <Component />
}
