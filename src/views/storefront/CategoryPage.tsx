'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import ProductCard from './components/ProductCard'

// Util Imports
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import { usePageSections } from '@/extensions/hooks/usePageSections'

// Import CSS
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

const CategoryPage = ({ slug }: { slug: string }) => {
  const t = useTranslations('storefront')
  const { beforeSections, afterSections } = usePageSections('storefront/category')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; description: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const productsPerPage = 12

  // Transform API product
  const transformProduct = (apiProduct: any): Product => ({
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
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        const sortMap: Record<SortOption, string | undefined> = {
          relevance: undefined,
          sales: 'sales',
          'name-asc': 'name',
          'name-desc': 'name',
          'price-asc': 'price_asc',
          'price-desc': 'price_desc'
        }

        const params: any = {
          category: slug,
          limit: productsPerPage,
          page: currentPage
        }

        if (sortMap[sortBy]) {
          params.sort = sortMap[sortBy]
        }

        const response = await storefrontApi.getProducts(params)
        const productsList = Array.isArray(response) ? response : response.results || response.data || []

        setProducts(productsList.map(transformProduct))
        setTotalCount(response.count || productsList.length)

        // Fetch category info
        try {
          const categoriesRes = await storefrontApi.getCategories()
          const categoriesList = Array.isArray(categoriesRes)
            ? categoriesRes
            : categoriesRes.results || categoriesRes.data || []
          const category = categoriesList.find((c: any) => c.slug === slug)
          if (category) {
            setCategoryInfo({
              name: category.name,
              description: category.description || ''
            })
          }
        } catch (err) {
          console.warn('Failed to fetch category info:', err)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug, sortBy, currentPage])

  const totalPages = Math.ceil(totalCount / productsPerPage)
  const categoryName = categoryInfo?.name || slug.charAt(0).toUpperCase() + slug.slice(1)
  const categoryDescription =
    categoryInfo?.description ||
    t('category.defaultDescription')

  return (
    <div className='sf-container' style={{ padding: '2rem 1rem' }}>
      {beforeSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
              <ext.component slug={slug} categoryInfo={categoryInfo} products={products} />
            </div>
          )
      )}
      {/* Breadcrumbs */}
      <nav className='sf-breadcrumb-nav'>
        <Link href='/' className='sf-breadcrumb-link' style={{ textDecoration: 'none' }}>
          {t('nav.home')}
        </Link>
        <span className='sf-breadcrumb-separator' style={{ margin: '0 0.5rem' }}>/</span>
        <span className='sf-breadcrumb-current'>{categoryName}</span>
      </nav>

      <div className='sf-category-layout'>
        {/* Sidebar */}
        <aside className={`sf-category-sidebar ${showFilters ? 'sf-show' : ''}`}>
          <div className='sf-card' style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 className='sf-sidebar-title' style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {t('category.sidebar.categoriesTitle')}
            </h3>
            <ul className='sf-sidebar-list' style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link
                  href='/category/clothes'
                  className='sf-sidebar-link'
                  style={{ textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  {t('category.sidebar.sampleClothes')}
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href='/category/shoes' className='sf-sidebar-link' style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
                  {t('category.sidebar.sampleShoes')}
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link
                  href='/category/accessories'
                  className='sf-sidebar-link'
                  style={{ textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  {t('category.sidebar.sampleAccessories')}
                </Link>
              </li>
            </ul>
          </div>

          <div className='sf-card' style={{ padding: '1.5rem' }}>
            <h3 className='sf-sidebar-title' style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {t('category.sidebar.priceTitle')}
            </h3>
            <div className='sf-filter-options' style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className='sf-filter-label' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type='checkbox' className='sf-filter-checkbox' />
                <span className='sf-filter-text'>$0 - $50</span>
              </label>
              <label className='sf-filter-label' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type='checkbox' className='sf-filter-checkbox' />
                <span className='sf-filter-text'>$50 - $100</span>
              </label>
              <label className='sf-filter-label' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type='checkbox' className='sf-filter-checkbox' />
                <span className='sf-filter-text'>$100+</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {showFilters && (
          <div className='sf-filter-overlay' onClick={() => setShowFilters(false)} />
        )}

        {/* Main Content */}
        <main className='sf-category-main'>
          {/* Category Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 className='sf-category-title'>
              {categoryName}
            </h1>
            <p className='sf-category-description'>{categoryDescription}</p>

            {/* Toolbar */}
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
                {/* View Mode */}
                <div className='sf-view-mode-toggle'>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'active' : ''}
                    aria-label={t('category.toolbar.gridViewAria')}
                  >
                    <i className='tabler-layout-grid' />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'active' : ''}
                    aria-label={t('category.toolbar.listViewAria')}
                  >
                    <i className='tabler-list' />
                  </button>
                </div>

                {/* Sort */}
                <div className='sf-sort-select-wrapper'>
                  <span className='sf-sort-label'>{t('category.toolbar.sortBy')}</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className='sf-sort-select'
                  >
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

          {/* Products Grid */}
          {loading ? (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='sf-pagination' style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    className='sf-pagination-btn'
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    {t('category.pagination.first')}
                  </button>
                  <button
                    className='sf-pagination-btn'
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    {t('category.pagination.previous')}
                  </button>
                  <span className='sf-pagination-info' style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                    {t('category.pagination.pageOf', { page: currentPage, total: totalPages })}
                  </span>
                  <button
                    className='sf-pagination-btn'
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    {t('category.pagination.next')}
                  </button>
                  <button
                    className='sf-pagination-btn'
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    {t('category.pagination.last')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p className='sf-text-muted'>{t('category.empty')}</p>
            </div>
          )}
        </main>
      </div>
      {afterSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginTop: '1.5rem' }}>
              <ext.component slug={slug} categoryInfo={categoryInfo} products={products} />
            </div>
          )
      )}
    </div>
  )
}

export default CategoryPage
