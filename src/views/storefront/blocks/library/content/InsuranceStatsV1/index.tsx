import React from 'react'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

type StatItem = { value?: string; label?: string }

export default function InsuranceStatsV1({ data, settings }: BlockProps) {
  const { stats = [] } = data as { stats?: StatItem[] }
  const rawTheme = settings?.theme
  const themeVariant =
    rawTheme === 'dark' || rawTheme === 'light' ? rawTheme : 'brand'

  return (
    <section className={`${styles.section} ${styles[themeVariant]}`}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {stats.map((stat: StatItem, index: number) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.value}>{stat.value}</div>
              <div className={styles.label}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
