// Shown when storefront config is missing or the request host does not match workspace_domain (see storefront layout).
import StorefrontSetupRequired from '@/components/storefront/StorefrontSetupRequired'

export default function UnknownPage() {
  return <StorefrontSetupRequired />
}
