'use client'

import { useRouter } from 'next/navigation'

import PostEditForm from '@/views/admin/settings/web/PostEditForm'

export default function PostNewPage() {
  const router = useRouter()

  return (
    <PostEditForm
      postId={null}
      onCancel={() => router.push('/admin/settings/web')}
      onCreated={post => router.push(`/admin/settings/web/posts/${post.id}/edit`)}
    />
  )
}
