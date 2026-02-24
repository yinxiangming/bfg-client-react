'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

type Slide = {
  id: number
  title: string
  subtitle: string
  description?: string
  image: string
  link?: string
  buttonText?: string
}

type HeroCarouselProps = {
  slides: Slide[]
  autoPlay?: boolean
  interval?: number
}

const HeroCarousel = ({ slides, autoPlay = true, interval = 5000 }: HeroCarouselProps) => {
  const t = useTranslations('storefront')
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  if (slides.length === 0) return null

  return (
    <div className='sf-hero'>
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`sf-hero-slide ${index === currentSlide ? 'active' : ''}`}
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${slide.image})`
          }}
        >
          <div className='sf-hero-overlay'>
            <div className='sf-hero-content'>
              <h1 className='sf-hero-title'>{slide.title}</h1>
              <h2 className='sf-hero-subtitle'>{slide.subtitle}</h2>
              {slide.description && <p className='sf-hero-description'>{slide.description}</p>}
              {slide.link && (
                <Link href={slide.link} className='sf-btn sf-btn-primary' style={{ color: 'white', textDecoration: 'none' }}>
                  {slide.buttonText || t('buttons.shopNow')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button className='sf-hero-nav sf-hero-nav-prev' onClick={goToPrevious}>
            <i className='tabler-chevron-left' style={{ fontSize: '1.5rem' }} />
          </button>
          <button className='sf-hero-nav sf-hero-nav-next' onClick={goToNext}>
            <i className='tabler-chevron-right' style={{ fontSize: '1.5rem' }} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className='sf-hero-dots'>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`sf-hero-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroCarousel
