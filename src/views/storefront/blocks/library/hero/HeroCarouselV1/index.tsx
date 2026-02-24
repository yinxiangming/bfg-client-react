'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getLocalizedText } from '@/utils/i18n'
import type { BlockProps } from '../../../types'
import styles from './styles.module.css'

interface Slide {
  image: string
  title?: string | Record<string, string>
  subtitle?: string | Record<string, string>
  buttonText?: string | Record<string, string>
  buttonLink?: string
}

interface HeroCarouselSettings {
  autoPlay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
  height?: string
}

interface HeroCarouselData {
  slides: Slide[]
}

export function HeroCarouselV1({
  settings,
  data,
  locale = 'en',
  isEditing,
}: BlockProps<HeroCarouselSettings, HeroCarouselData>) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const slides = data.slides || []

  const {
    autoPlay = true,
    interval = 5000,
    showArrows = true,
    showDots = true,
    height = '500px',
  } = settings

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-play
  useEffect(() => {
    if (!autoPlay || slides.length <= 1 || isEditing) return

    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, slides.length, isEditing, goToNext])

  if (slides.length === 0) {
    if (isEditing) {
      return (
        <div className={styles.placeholder} style={{ height }}>
          <p>Add slides to this carousel</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.carousel} style={{ height }}>
      {/* Slides */}
      <div className={styles.slides}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
          >
            {slide.image && (
              <img
                src={slide.image}
                alt={getLocalizedText(slide.title, locale) || `Slide ${index + 1}`}
                className={styles.image}
              />
            )}
            <div className={styles.content}>
              {slide.title && (
                <h1 className={styles.title}>{getLocalizedText(slide.title, locale)}</h1>
              )}
              {slide.subtitle && (
                <p className={styles.subtitle}>{getLocalizedText(slide.subtitle, locale)}</p>
              )}
              {slide.buttonText && slide.buttonLink && (
                <Link href={slide.buttonLink} className={styles.button}>
                  {getLocalizedText(slide.buttonText, locale)}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={goToPrev}
            aria-label='Previous slide'
          >
            ‹
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={goToNext}
            aria-label='Next slide'
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroCarouselV1
