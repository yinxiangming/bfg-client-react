'use client'

import React, { useState } from 'react'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

type FaqItem = { question: string; answer: string }

export default function InsuranceFaqV1({ data, settings }: BlockProps) {
  const { title, subtitle, faqs = [] } = data as {
    title?: string
    subtitle?: string
    faqs?: FaqItem[]
  }
  const rawTheme = settings?.theme
  const themeVariant = rawTheme === 'gray' ? 'gray' : 'light'

  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className={`${styles.section} ${styles[themeVariant]}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq: FaqItem, index: number) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
                <button
                  className={styles.question}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{faq.question}</span>
                  <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
                </button>
                <div
                  className={styles.answerWrapper}
                  style={{ maxHeight: isOpen ? '500px' : '0' }}
                >
                  <div className={styles.answer}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
