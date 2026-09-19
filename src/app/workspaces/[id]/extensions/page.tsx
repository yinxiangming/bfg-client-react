'use client'

import { use } from 'react'

import WorkspaceExtensionsPage from '@/views/console/WorkspaceExtensionsPage'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return <WorkspaceExtensionsPage workspaceId={Number(id)} />
}
