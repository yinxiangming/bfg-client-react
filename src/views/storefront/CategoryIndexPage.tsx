'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { storefrontApi } from '@/utils/storefrontApi'
import '@/styles/storefront.css'

type Category = { slug: string; name: string; description?: string; children?: Category[] }

function flatten(items: Category[]): Category[] {
  return items.flatMap(item => [item, ...(item.children?.length ? flatten(item.children) : [])])
}

export default function CategoryIndexPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storefrontApi
      .getCategories({ tree: true })
      .then(response => {
        const list = Array.isArray(response) ? response : response?.results || response?.data || []
        setCategories(flatten(list.filter((item: Category) => item?.slug && item?.name)))
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className='sf-container' style={{ paddingBlock: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p className='sf-text-muted' style={{ marginBottom: '.5rem' }}>Browse the shop</p>
        <h1 style={{ margin: 0 }}>Categories</h1>
      </header>
      {loading ? (
        <p className='sf-text-muted'>Loading categories…</p>
      ) : categories.length === 0 ? (
        <section className='sf-card' aria-live='polite' style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Your shop is ready for its first collection.</h2>
          <p>Categories will appear here once you add them in your workspace.</p>
          <Link className='sf-btn sf-btn-primary' href='/shop'>Browse all items</Link>
        </section>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {categories.map(category => (
            <Link key={category.slug} href={`/category/${encodeURIComponent(category.slug)}`} className='sf-card' style={{ padding: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{category.name}</h2>
              {category.description ? <p className='sf-text-muted' style={{ margin: '.5rem 0 0' }}>{category.description}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
