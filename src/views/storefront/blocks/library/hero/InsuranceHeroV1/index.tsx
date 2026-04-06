import React from 'react'
import type { BlockProps } from '../../../../types'
import styles from './styles.module.css'

export default function InsuranceHeroV1({ data, settings }: BlockProps) {
  const { title, subtitle, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, image } = data
  const { height = '800px', align = 'left', theme = 'light' } = settings

  // Helper to parse italic text wrapped in *asterisks* to <i> tags for the elegant serif look
  const formatTitle = (text: string) => {
    if (!text) return null;
    const parts = text.split(/\*(.*?)\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <i key={i}>{part}</i> : part));
  }

  return (
    <section
      className={`${styles.hero} ${styles[theme]} ${styles[align]}`}
      style={{ minHeight: height }}
    >
      <div className={styles.noise}></div>
      <div className={styles.container}>
        <div className={styles.content}>
          {title && <h1 className={styles.title}>{formatTitle(title)}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.actions}>
            {primaryButtonText && (
              <a href={primaryButtonLink || '#'} className={styles.primaryButton}>
                <span className={styles.btnText}>{primaryButtonText}</span>
                <span className={styles.btnArrow}>→</span>
              </a>
            )}
            {secondaryButtonText && (
              <a href={secondaryButtonLink || '#'} className={styles.secondaryButton}>
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
        {image && (
          <div className={styles.imageColumn}>
            <div className={styles.imageWrapper}>
              <img src={image} alt="Hero" className={styles.image} />
              <div className={styles.imageOverlay}></div>
            </div>
            <div className={styles.decorativeLine}></div>
          </div>
        )}
      </div>
    </section>
  )
}
