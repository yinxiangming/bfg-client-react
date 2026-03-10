'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ProductCard from './components/ProductCard'
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import '@/styles/storefront.css'

type Product = {
  id: number
  name: string
  brand: string
  price: number
  originalPrice: number | null
  discount: number | null
  rating: number
  reviews: number
  image: string
  isNew: boolean
}

type SortOption = 'relevance' | 'sales' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

const productsPerPage = 12
const sortMap: Record<SortOption, string | undefined> = {
  relevance: undefined,
  sales: 'sales',
  'name-asc': 'name',
  'name-desc': 'name',
  'price-asc': 'price_asc',
  'price-desc': 'price_desc'
}

function transformProduct(apiProduct: any): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: apiProduct.brand || '',
    price: parseFloat(apiProduct.price || '0'),
    originalPrice: apiProduct.compare_price ? parseFloat(apiProduct.compare_price) : null,
    discount: apiProduct.discount_percentage || null,
    rating: apiProduct.rating || 0,
    reviews: apiProduct.reviews_count || 0,
    image:
      getMediaUrl(apiProduct.primary_image || (apiProduct.images && apiProduct.images[0]) || '') ||
      getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg'),
    isNew: apiProduct.is_new || false
  }
}

export default function SearchPage() {
  const t = useTranslations('storefront')
  const router = useRouter()
  const searchParams = useSearchParams()

  const qFromUrl = searchParams.get('q') ?? ''
  const categoryFromUrl = searchParams.get('category') ?? ''
  const sortFromUrl = (searchParams.get('sort') as SortOption) || 'relevance'
  const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [keyword, setKeyword] = useState(qFromUrl)
  const [categoryFilter, setCategoryFilter] = useState(categoryFromUrl)
  const [sortBy, setSortBy] = useState<SortOption>(sortFromUrl)
  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])

  const updateUrl = useCallback(
    (updates: { q?: string; category?: string; sort?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.q !== undefined) (updates.q ? params.set('q', updates.q) : params.delete('q'))
      if (updates.category !== undefined) (updates.category ? params.set('category', updates.category) : params.delete('category'))
      if (updates.sort !== undefined) (updates.sort ? params.set('sort', updates.sort) : params.delete('sort'))
      if (updates.page !== undefined) (updates.page && updates.page > 1 ? params.set('page', String(updates.page)) : params.delete('page'))
      router.replace(`/search?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const refreshResults = useCallback(() => {
    updateUrl({ q: keyword.trim() || undefined, category: categoryFilter || undefined, sort: sortBy !== 'relevance' ? sortBy : undefined, page: currentPage !== 1 ? currentPage : undefined })
  }, [keyword, categoryFilter, sortBy, currentPage, updateUrl])

  useEffect(() => {
    setKeyword(qFromUrl)
    setCategoryFilter(categoryFromUrl)
    setSortBy((sortFromUrl as SortOption) || 'relevance')
    setCurrentPage(pageFromUrl)
  }, [qFromUrl, categoryFromUrl, sortFromUrl, pageFromUrl])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await storefrontApi.getCategories({ tree: true })
        const list = Array.isArray(res) ? res : res.results || res.data || []
        const flatten = (items: any[]): { name: string; slug: string }[] => {
          return items.flatMap((c: any) => {
            const slug = c.slug || c.name?.toLowerCase().replace(/\s+/g, '-')
            const here = c.name ? [{ name: c.name, slug }] : []
            return [...here, ...(c.children?.length ? flatten(c.children) : [])]
          })
        }
        setCategories(flatten(list))
      } catch {
        setCategories([])
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    const category = searchParams.get('category') ?? ''
    const sort = searchParams.get('sort') as SortOption | null
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

    if (!q.trim()) {
      setProducts([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    let cancelled = false
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params: any = {
          q: q.trim(),
          limit: productsPerPage,
          page
        }
        if (category) params.category = category
        if (sort && sortMap[sort]) params.sort = sortMap[sort]

        const response = await storefrontApi.getProducts(params)
        if (cancelled) return
        const productsList = Array.isArray(response) ? response : response.results || response.data || []
        setProducts(productsList.map(transformProduct))
        setTotalCount(response.count ?? productsList.length)
        setCurrentPage(page)
      } catch (err) {
        if (!cancelled) console.error('Error fetching search products:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProducts()
    return () => { cancelled = true }
  }, [searchParams])

  const totalPages = Math.ceil(totalCount / productsPerPage)
  const effectiveKeyword = searchParams.get('q') ?? ''

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    updateUrl({ sort: value !== 'relevance' ? value : undefined, page: undefined })
    setCurrentPage(1)
  }

  const handleCategoryChange = (slug: string) => {
    setCategoryFilter(slug)
    updateUrl({ category: slug || undefined, page: undefined })
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl({ page: page > 1 ? page : undefined })
  }

  return (
    <div className='sf-container' style={{ padding: '2rem 1rem' }}>
      <nav className='sf-breadcrumb-nav'>
        <Link href='/' className='sf-breadcrumb-link' style={{ textDecoration: 'none' }}>
          {t('nav.home')}
        </Link>
        <span className='sf-breadcrumb-separator' style={{ margin: '0 0.5rem' }}>/</span>
        <span className='sf-breadcrumb-current'>{t('search.title')}</span>
      </nav>

      <div className='sf-category-layout'>
        <aside className={`sf-category-sidebar ${showFilters ? 'sf-show' : ''}`}>
          <div className='sf-card' style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 className='sf-sidebar-title' style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {t('category.sidebar.categoriesTitle')}
            </h3>
            <ul className='sf-sidebar-list' style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <button
                  type='button'
                  className='sf-sidebar-link'
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0, textDecoration: categoryFilter === '' ? 'underline' : 'none' }}
                  onClick={() => handleCategoryChange('')}
                >
                  All
                </button>
              </li>
              {categories.map(c => (
                <li key={c.slug} style={{ marginBottom: '0.5rem' }}>
                  <button
                    type='button'
                    className='sf-sidebar-link'
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', padding: 0, textDecoration: categoryFilter === c.slug ? 'underline' : 'none' }}
                    onClick={() => handleCategoryChange(c.slug)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {showFilters && <div className='sf-filter-overlay' onClick={() => setShowFilters(false)} />}

        <main className='sf-category-main'>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className='sf-category-title'>{t('search.title')}</h1>
            <p className='sf-category-description'>
              {effectiveKeyword ? t('search.resultsFor', { keyword: effectiveKeyword }) : t('search.enterKeyword')}
            </p>

            {/* Search bar: modify keyword and refresh */}
            <form
              onSubmit={e => {
                e.preventDefault()
                refreshResults()
              }}
              style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <i className='tabler-search' style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#757575' }} />
                <input
                  type='text'
                  placeholder={t('search.placeholder')}
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className='sf-search-input'
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
              <button type='submit' className='sf-filter-toggle-btn'>
                {t('search.refresh')}
              </button>
            </form>

            <div className='sf-category-toolbar'>
              <div className='sf-category-toolbar-left'>
                <button
                  className='sf-filter-toggle-btn'
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label={t('category.toolbar.toggleFiltersAria')}
                >
                  <i className='tabler-adjustments-horizontal' style={{ marginRight: '0.5rem' }} />
                  {t('category.toolbar.filters')}
                </button>
                <p className='sf-products-count'>{t('category.toolbar.productsCount', { count: totalCount })}</p>
              </div>
              <div className='sf-category-toolbar-right'>
                <div className='sf-view-mode-toggle'>
                  <button type='button' onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''} aria-label={t('category.toolbar.gridViewAria')}>
                    <i className='tabler-layout-grid' />
                  </button>
                  <button type='button' onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''} aria-label={t('category.toolbar.listViewAria')}>
                    <i className='tabler-list' />
                  </button>
                </div>
                <div className='sf-sort-select-wrapper'>
                  <span className='sf-sort-label'>{t('category.toolbar.sortBy')}</span>
                  <select value={sortBy} onChange={e => handleSortChange(e.target.value as SortOption)} className='sf-sort-select'>
                    <option value='relevance'>{t('category.toolbar.sort.relevance')}</option>
                    <option value='sales'>{t('category.toolbar.sort.sales')}</option>
                    <option value='name-asc'>{t('category.toolbar.sort.nameAsc')}</option>
                    <option value='name-desc'>{t('category.toolbar.sort.nameDesc')}</option>
                    <option value='price-asc'>{t('category.toolbar.sort.priceAsc')}</option>
                    <option value='price-desc'>{t('category.toolbar.sort.priceDesc')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {!effectiveKeyword.trim() ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p className='sf-text-muted'>{t('search.empty')}</p>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p className='sf-text-muted'>{t('common.loading')}</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? 'sf-grid sf-grid-cols-4' : ''} style={{ marginBottom: '2rem' }}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className='sf-pagination' style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button type='button' className='sf-pagination-btn' onClick={() => handlePageChange(1)} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                    {t('category.pagination.first')}
                  </button>
                  <button type='button' className='sf-pagination-btn' onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                    {t('category.pagination.previous')}
                  </button>
                  <span className='sf-pagination-info' style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                    {t('category.pagination.pageOf', { page: currentPage, total: totalPages })}
                  </span>
                  <button type='button' className='sf-pagination-btn' onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                    {t('category.pagination.next')}
                  </button>
                  <button type='button' className='sf-pagination-btn' onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                    {t('category.pagination.last')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p className='sf-text-muted'>{t('search.empty')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
