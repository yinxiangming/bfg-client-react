import React from 'react'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

type ServiceItem = { title?: string; description?: string; icon?: string; link?: string }

export default function InsuranceServiceGridV1({ data, settings }: BlockProps) {
  const { title, subtitle, services = [] } = data as {
    title?: string
    subtitle?: string
    services?: ServiceItem[]
  }
  const cols = typeof settings?.columns === 'number' ? settings.columns : Number(settings?.columns) || 3
  const rawTheme = settings?.theme
  const themeVariant =
    rawTheme === 'dark' || rawTheme === 'forest' ? rawTheme : 'light'

  return (
    <section className={`${styles.section} ${styles[themeVariant]}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.headerLine}></div>
        </div>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {services.map((service: ServiceItem, index: number) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>0{index + 1}</span>
                {service.icon && (
                  <div className={styles.iconWrapper}>
                    <img src={service.icon} alt={service.title} className={styles.icon} />
                  </div>
                )}
              </div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
              {service.link && (
                <a href={service.link} className={styles.link}>
                  <span>Explore</span>
                  <span className={styles.linkArrow}>↗</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
