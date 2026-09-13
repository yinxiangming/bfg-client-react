import OrderDetail from '@/views/account/OrderDetail'
import { getTranslations } from 'next-intl/server'

type Props = { orderId: number }

const OrderDetailDefault = async ({ orderId }: Props) => {
  const t = await getTranslations('account.orderDetail')

  if (Number.isNaN(orderId)) {
    return <div className='acc-empty'>{t('notFound')}</div>
  }

  return <OrderDetail orderId={orderId} />
}

export default OrderDetailDefault
