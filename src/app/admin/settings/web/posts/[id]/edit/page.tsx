'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import PostEditForm from '@/views/admin/settings/web/PostEditForm'

export default function PostEditPage() {
  const router = useRouter()
  const params = useParams()
  const raw = params.id
  const idStr = Array.isArray(raw) ? raw[0] : raw
  const postId = idStr != null && idStr !== '' ? Number.parseInt(String(idStr), 10) : Number.NaN

  useEffect(() => {
    if (Number.isNaN(postId) || postId < 1) {
      router.replace('/admin/settings/web')
    }
  }, [postId, router])

  if (Number.isNaN(postId) || postId < 1) {
    return null
  }

  return (
    <PostEditForm postId={postId} onCancel={() => router.push('/admin/settings/web')} />
  )
}
