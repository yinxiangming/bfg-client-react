import React from 'react'
import type { BlockProps } from '../../../../types'
import styles from './styles.module.css'

export default function InsuranceStatsV1({ data, settings }: BlockProps) {
  const { stats = [] } = data
  const { theme = 'brand' } = settings

  return (
    <section className={`${styles.section} ${styles[theme]}`}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {stats.map((stat: any, index: number) => (
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
