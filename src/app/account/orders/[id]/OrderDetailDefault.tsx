import Box from '@mui/material/Box'
import OrderDetail from '@/views/account/OrderDetail'
import { getTranslations } from 'next-intl/server'

type Props = { orderId: number }

const OrderDetailDefault = async ({ orderId }: Props) => {
  const t = await getTranslations('account.orderDetail')

  if (Number.isNaN(orderId)) {
    return <div className='p-4'>{t('notFound')}</div>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <OrderDetail orderId={orderId} />
    </Box>
  )
}

export default OrderDetailDefault
