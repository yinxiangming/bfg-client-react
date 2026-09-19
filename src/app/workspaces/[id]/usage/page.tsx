'use client'

import { use } from 'react'

import WorkspaceUsagePage from '@/views/console/WorkspaceUsagePage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return <WorkspaceUsagePage workspaceId={Number(id)} />
}
