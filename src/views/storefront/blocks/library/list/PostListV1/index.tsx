'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getLocalizedText } from '@/utils/i18n'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

interface Post {
  id: number
  title: string
  slug: string
  excerpt?: string
  featured_image?: string
  category_name?: string
  published_at?: string
  custom_fields?: Record<string, unknown>
}

interface PostListSettings {
  layout?: 'grid' | 'list'
  columns?: number
  showExcerpt?: boolean
  showImage?: boolean
  showCategory?: boolean
  showDate?: boolean
}

interface PostListData {
  source?: 'latest' | 'category' | 'manual'
  contentType?: string
  categorySlug?: string
  postIds?: number[]
  limit?: number
  title?: string | Record<string, string>
  viewAllLink?: string
  viewAllText?: string | Record<string, string>
}

export function PostListV1({
  settings,
  data,
  resolvedData,
  locale = 'en',
  isEditing,
}: BlockProps<PostListSettings, PostListData>) {
  const {
    layout = 'grid',
    columns = 3,
    showExcerpt = true,
    showImage = true,
    showCategory = true,
    showDate = true,
  } = settings

  const posts = (resolvedData as Post[]) || []
  const title = getLocalizedText(data.title, locale)
  const viewAllText = getLocalizedText(data.viewAllText, locale) || 'View All'

  if (posts.length === 0) {
    if (isEditing) {
      return (
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.placeholder}>
              <p>No posts found. Configure the data source in settings.</p>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        {(title || data.viewAllLink) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {data.viewAllLink && (
              <Link href={data.viewAllLink} className={styles.viewAll}>
                {viewAllText} →
              </Link>
            )}
          </div>
        )}

        {/* Grid/List */}
        <div
          className={`${styles.grid} ${layout === 'list' ? styles.list : ''}`}
          style={
            layout === 'grid' ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined
          }
        >
          {posts.map((post) => (
            <article key={post.id} className={styles.card}>
              {showImage && post.featured_image && (
                <Link href={`/post/${post.slug}`} className={styles.imageWrapper}>
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Link>
              )}
              <div className={styles.content}>
                <div className={styles.meta}>
                  {showCategory && post.category_name && (
                    <span className={styles.category}>{post.category_name}</span>
                  )}
                  {showDate && post.published_at && (
                    <span className={styles.date}>
                      {new Date(post.published_at).toLocaleDateString(locale)}
                    </span>
                  )}
                </div>
                <h3 className={styles.postTitle}>
                  <Link href={`/post/${post.slug}`}>{post.title}</Link>
                </h3>
                {showExcerpt && post.excerpt && (
                  <p className={styles.excerpt}>{post.excerpt}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PostListV1
