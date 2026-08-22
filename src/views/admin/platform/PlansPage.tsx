/**
 * Plans & Billing — /admin/platform/plans
 * Shows available subscription plans with monthly/annual toggle.
 */
import Box from '@mui/material/Box'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PricingTable from '@/components/platform/PricingTable'

export default function PlansPage() {
  return (
    <Box>
      <AdminPageHeader title='Plans & Billing' subtitle='Choose the right plan for your business.' />
      <PricingTable />
    </Box>
  )
}
