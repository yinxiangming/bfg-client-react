'use client'

import React from 'react'
import Link from 'next/link'
import { getLocalizedText } from '@/utils/i18n'
import { getMediaUrl } from '@/utils/media'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

interface Banner {
  image: string
  title?: string | Record<string, string>
  link?: string
}

interface BannerGridSettings {
  columns?: number
  imageHeight?: string
  showOverlay?: boolean
}

interface BannerGridData {
  banners: Banner[]
}

export function BannerGridV1({
  settings,
  data,
  locale = 'en',
  isEditing,
}: BlockProps<BannerGridSettings, BannerGridData>) {
  const { columns = 3, imageHeight = '240px', showOverlay = true } = settings
  const banners = data.banners || []

  if (banners.length === 0) {
    if (isEditing) {
      return (
        <section className={styles.container}>
          <div className={styles.empty}>Add banners to this block</div>
        </section>
      )
    }
    return null
  }

  return (
    <section className={styles.container}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {banners.map((banner, index) => {
          const title = getLocalizedText(banner.title, locale)
          const imageUrl = getMediaUrl(banner.image) || banner.image

          const content = (
            <div className={styles.card}>
              <img
                src={imageUrl}
                alt={title || `Banner ${index + 1}`}
                className={styles.image}
                style={{ height: imageHeight }}
              />
              {showOverlay && <div className={styles.overlay} />}
              {title && (
                <div className={styles.content}>
                  <h3 className={styles.title}>{title}</h3>
                </div>
              )}
            </div>
          )

          if (banner.link) {
            return (
              <Link key={index} href={banner.link} className={styles.link}>
                {content}
              </Link>
            )
          }

          return (
            <div key={index} className={styles.link}>
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BannerGridV1
