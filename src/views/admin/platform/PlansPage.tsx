/**
 * Plans & Billing — /admin/platform/plans
 * Shows available subscription plans with monthly/annual toggle.
 */
import PricingTable from '@/components/platform/PricingTable'

export default function PlansPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Plans & Billing</h1>
      <p className="text-gray-500 mb-8">Choose the right plan for your business.</p>
      <PricingTable />
    </div>
  )
}
