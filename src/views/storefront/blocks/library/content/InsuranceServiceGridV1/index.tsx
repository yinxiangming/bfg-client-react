import React from 'react'
import type { BlockProps } from '../../../../types'
import styles from './styles.module.css'

export default function InsuranceServiceGridV1({ data, settings }: BlockProps) {
  const { title, subtitle, services = [] } = data
  const { columns = 3, theme = 'light' } = settings

  return (
    <section className={`${styles.section} ${styles[theme]}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.headerLine}></div>
        </div>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {services.map((service: any, index: number) => (
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
