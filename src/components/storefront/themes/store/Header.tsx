'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Logo from '@components/Logo'
import { useCart } from '@/contexts/CartContext'
import { useTheme } from '@/contexts/ThemeContext'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { storefrontApi } from '@/utils/storefrontApi'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

type CategoryItem = { name: string; slug: string }
type CategorySubcategory = { name: string; slug: string; items: CategoryItem[] }
type CategoryWithSubs = { name: string; slug: string; subcategories: CategorySubcategory[] }
type CategoryType = string | CategoryWithSubs

type StoreHeaderProps = { mode?: 'light' | 'dark' }

export default function StoreHeader(_props: StoreHeaderProps) {
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [mounted, setMounted] = useState(false)

  const { getItemCount } = useCart()
  const theme = useTheme()
  const t = useTranslations('storefront')
  const config = useStorefrontConfigSafe()
  const opts = config.header_options ?? {}
  const showSearch = opts.show_search !== false
  const showCart = opts.show_cart !== false
  const showLanguageSwitcher = opts.show_language_switcher !== false
  const showStyleSelector = opts.show_style_selector !== false
  const showLogin = opts.show_login !== false

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(authApi.isAuthenticated())
    checkAuth()
    window.addEventListener('storage', checkAuth)
    const interval = setInterval(checkAuth, 1000)
    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [])

  const transformCategoryTree = (apiCategories: any[]): CategoryType[] => {
    return apiCategories.map(category => {
      if (category.children && category.children.length > 0) {
        const subcategories: CategorySubcategory[] = category.children.map((child: any) => {
          if (child.children && child.children.length > 0) {
            const items: CategoryItem[] = child.children.map((grandchild: any) => ({
              name: grandchild.name,
              slug: grandchild.slug || grandchild.name.toLowerCase().replace(/\s+/g, '-')
            }))
            return { name: child.name, slug: child.slug || child.name.toLowerCase().replace(/\s+/g, '-'), items }
          }
          return { name: child.name, slug: child.slug || child.name.toLowerCase().replace(/\s+/g, '-'), items: [] }
        })
        return {
          name: category.name,
          slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
          subcategories: subcategories.length > 0 ? subcategories : []
        }
      }
      return category.name
    })
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await storefrontApi.getCategories({ tree: true })
        const categoriesList = Array.isArray(response) ? response : response.results || response.data || []
        setCategories(transformCategoryTree(categoriesList))
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <>
      <div className='sf-header-top'>
        <div className='sf-header-top-content'>
          <div className='sf-header-top-left'>
            {config.contact_phone && <span className='sf-header-top-text'>{config.contact_phone}</span>}
            {config.contact_email && <span className='sf-header-top-text'>{config.contact_email}</span>}
            {config.top_bar_announcement && (
              <span style={{ color: 'var(--primary-color, #6366f1)', fontWeight: 500 }}>{config.top_bar_announcement}</span>
            )}
          </div>
          <div className='sf-header-top-right'>
            {showLanguageSwitcher && (
              <div className='sf-dropdown' style={{ position: 'relative' }}>
                <LanguageSwitcher triggerVariant='minimal' />
              </div>
            )}
            <div className='sf-dropdown' style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}>
              <span>{config.default_currency || 'NZD'}</span>
              <i className='tabler-chevron-down' style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }} />
              {currencyMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', marginTop: '0.5rem', minWidth: '120px', zIndex: 1000 }}>
                  <span className='sf-dropdown-link' style={{ display: 'block', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {config.default_currency || 'NZD'}
                  </span>
                </div>
              )}
            </div>
            {showStyleSelector && (
              <div className='sf-dropdown' style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setThemeMenuOpen(!themeMenuOpen)}>
                <i
                  className={mounted ? (theme.mode === 'system' ? (theme.systemMode === 'dark' ? 'tabler-moon' : 'tabler-sun') : theme.mode === 'dark' ? 'tabler-moon' : 'tabler-sun') : 'tabler-sun'}
                  style={{ fontSize: '1rem' }}
                />
                {themeMenuOpen && (
                  <div className='sf-dropdown-menu' style={{ position: 'absolute', top: '100%', right: 0, background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', marginTop: '0.5rem', minWidth: '140px', zIndex: 1000 }}>
                    <a href='#' className='sf-dropdown-link' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.875rem', backgroundColor: theme.mode === 'light' ? '#f0f1ff' : 'transparent' }} onClick={e => { e.preventDefault(); theme.setMode('light'); setThemeMenuOpen(false) }}>
                      <i className='tabler-sun' style={{ fontSize: '0.875rem' }} /><span>Light</span>
                    </a>
                    <a href='#' className='sf-dropdown-link' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.875rem', backgroundColor: theme.mode === 'dark' ? '#f0f1ff' : 'transparent' }} onClick={e => { e.preventDefault(); theme.setMode('dark'); setThemeMenuOpen(false) }}>
                      <i className='tabler-moon' style={{ fontSize: '0.875rem' }} /><span>Dark</span>
                    </a>
                    <a href='#' className='sf-dropdown-link' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', textDecoration: 'none', fontSize: '0.875rem', backgroundColor: theme.mode === 'system' ? '#f0f1ff' : 'transparent' }} onClick={e => { e.preventDefault(); theme.setMode('system'); setThemeMenuOpen(false) }}>
                      <i className='tabler-device-desktop' style={{ fontSize: '0.875rem' }} /><span>System</span>
                    </a>
                  </div>
                )}
              </div>
            )}
            {showLogin && (isAuthenticated ? (
              <Link href='/account' className='sf-header-top-link' style={{ textDecoration: 'none' }}>{t('topBar.myAccount')}</Link>
            ) : (
              <Link href='/auth/login' className='sf-header-top-link' style={{ textDecoration: 'none' }}>{t('topBar.login')}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className='sf-header-main'>
        <div className='sf-header-main-content'>
          <nav className='sf-nav'>
            <button className='sf-icon-btn sf-mobile-menu-btn' onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label='Toggle menu'>
              <i className='tabler-menu-2 sf-nav-icon' style={{ fontSize: '1.5rem' }} />
            </button>
            <Logo color='#ffffff' />
            <ul className='sf-nav-menu'>
              {loadingCategories ? <li>Loading...</li> : categories.map((category, index) => {
                const categoryKey = typeof category === 'string' ? category : category.slug || category.name
                return (
                  <li key={categoryKey || index} className='sf-nav-item'>
                    {typeof category === 'string' ? (
                      <Link href={`/category/${category.toLowerCase()}`} className='sf-nav-link'>{category}</Link>
                    ) : (
                      <>
                        <a href='#' className='sf-nav-link' onClick={e => { e.preventDefault(); setCategoryOpen(categoryOpen === category.name ? null : category.name) }}>
                          {category.name}
                        </a>
                        {categoryOpen === category.name && category.subcategories.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '1rem', minWidth: '600px', zIndex: 50 }} onMouseLeave={() => setCategoryOpen(null)}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                              {category.subcategories.map((sub, subIndex) => (
                                <div key={sub.slug || subIndex}>
                                  <Link href={`/category/${sub.slug}`} className='sf-category-sub-link' style={{ fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>{sub.name}</Link>
                                  {sub.items?.length > 0 && sub.items.map((item, itemIndex) => (
                                    <Link key={item.slug || itemIndex} href={`/category/${item.slug}`} className='sf-category-item-link' style={{ display: 'block', textDecoration: 'none', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{item.name}</Link>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className='sf-header-actions'>
            {showSearch && (
              <div className='sf-search-box'>
                <i className='tabler-search sf-search-icon' />
                <input type='text' placeholder={t('search.placeholder')} className='sf-search-input' />
              </div>
            )}
            <button className='sf-icon-btn'><i className='tabler-heart' style={{ fontSize: '1.25rem' }} /><span className='sf-badge'>0</span></button>
            <button className='sf-icon-btn'><i className='tabler-scale' style={{ fontSize: '1.25rem' }} /><span className='sf-badge'>0</span></button>
            {showCart && (
              <Link href='/cart' className='sf-icon-btn' style={{ textDecoration: 'none', color: 'inherit' }}>
                <i className='tabler-shopping-cart' style={{ fontSize: '1.25rem' }} />
                {getItemCount() > 0 && <span className='sf-badge'>{getItemCount()}</span>}
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, width: '80%', maxWidth: '320px', height: '100vh', background: 'white', boxShadow: '2px 0 8px rgba(0,0,0,0.1)', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Logo color='#6366f1' />
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: '#757575', padding: '0.25rem' }} aria-label='Close menu'>×</button>
            </div>
            {showSearch && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <i className='tabler-search' style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.125rem', color: '#757575' }} />
                  <input type='text' placeholder='Search products...' style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }} />
                </div>
              </div>
            )}
            <nav>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#757575', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Categories</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {loadingCategories ? <li style={{ padding: '0.75rem 0', color: '#757575' }}>Loading...</li> : categories.map((category, index) => {
                  const categoryKey = typeof category === 'string' ? category : category.slug || category.name
                  return (
                    <li key={categoryKey || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {typeof category === 'string' ? (
                        <Link href={`/category/${category.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: '#2c3e50', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>{category}</Link>
                      ) : (
                        <div>
                          <button onClick={() => setCategoryOpen(categoryOpen === category.name ? null : category.name)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', background: 'none', border: 'none', color: '#2c3e50', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                            <span>{category.name}</span>
                            <i className={`tabler-chevron-${categoryOpen === category.name ? 'up' : 'down'}`} style={{ fontSize: '1rem' }} />
                          </button>
                          {categoryOpen === category.name && category.subcategories.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: '0 0 0.5rem 1rem', margin: 0, backgroundColor: '#fafafa' }}>
                              {category.subcategories.map((sub, subIndex) => (
                                <li key={sub.slug || subIndex}>
                                  <Link href={`/category/${sub.slug}`} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.5rem 0', color: '#757575', textDecoration: 'none', fontSize: '0.875rem' }}>{sub.name}</Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
            {showLogin && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                {isAuthenticated ? (
                  <Link href='/account' onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', color: '#2c3e50', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
                    <i className='tabler-user' style={{ fontSize: '1.25rem' }} /> My Account
                  </Link>
                ) : (
                  <Link href='/auth/login' onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', color: '#2c3e50', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
                    <i className='tabler-login' style={{ fontSize: '1.25rem' }} /> Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
