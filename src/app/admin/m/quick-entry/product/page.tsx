import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import ProductEntryForm from '@/views/admin/mobile/ProductEntryForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.mobileAdmin.productEntry')
  return { title: t('title') }
}

export default function ProductEntryPage() {
  return <ProductEntryForm />
}
