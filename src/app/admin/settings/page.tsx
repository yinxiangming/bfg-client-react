import { redirect } from 'next/navigation'

export const metadata = { title: 'Settings' }

export default function Page() {
  redirect('/admin/settings/general')
}

