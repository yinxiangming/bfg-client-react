import { resolveAccountPage } from '@/components/account/themes/resolve'
import OrderDetailDefault from './OrderDetailDefault'

type Params = { id: string }

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const orderId = Number(id)
  const Override = await resolveAccountPage('orders/[id]')
  if (Override) return <Override orderId={orderId} id={id} />
  return <OrderDetailDefault orderId={orderId} />
}
