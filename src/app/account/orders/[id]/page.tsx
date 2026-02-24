// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderDetail from '@/views/account/OrderDetail'

// Utils
import { getTranslations } from 'next-intl/server'

type Params = { id: string }

const OrderDetailPage = async ({ params }: { params: Promise<Params> }) => {
  const { id } = await params
  const orderId = Number(id)
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

export default OrderDetailPage
