'use client'

import React from 'react'
import { getLocalizedText } from '@/utils/i18n'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

interface TextBlockSettings {
  align?: 'left' | 'center' | 'right'
  maxWidth?: string
  backgroundColor?: string
  /** When true, skip the .content CSS-module wrapper so CMS HTML uses its own semantic classes */
  rawHtml?: boolean
}

interface TextBlockData {
  content: string | Record<string, string>
  title?: string | Record<string, string>
}

export function TextBlockV1({
  settings,
  data,
  locale = 'en',
  isEditing,
}: BlockProps<TextBlockSettings, TextBlockData>) {
  const { align = 'left', maxWidth = '800px', backgroundColor, rawHtml } = settings

  const content = getLocalizedText(data.content, locale)
  const title = getLocalizedText(data.title, locale)

  if (!content && !title) {
    if (isEditing) {
      return (
        <section className={styles.section} style={{ backgroundColor }}>
          <div className={styles.container} style={{ maxWidth }}>
            <div className={styles.placeholder}>
              <p>Add content to this text block</p>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  return (
    <section className={styles.section} style={{ backgroundColor }}>
      <div className={styles.container} style={{ maxWidth }}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {content && (
          rawHtml
            ? <div dangerouslySetInnerHTML={{ __html: content }} />
            : <div className={styles.content} style={{ textAlign: align }} dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </section>
  )
}

export default TextBlockV1
