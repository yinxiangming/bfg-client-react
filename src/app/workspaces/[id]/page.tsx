'use client'

import { use } from 'react'

import WorkspaceOverviewPage from '@/views/console/WorkspaceOverviewPage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return <WorkspaceOverviewPage workspaceId={Number(id)} />
}
