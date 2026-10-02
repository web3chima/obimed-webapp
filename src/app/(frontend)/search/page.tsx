import type { Metadata } from 'next/types'
import type { Where } from 'payload'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'
import { ArrowRightIcon } from 'lucide-react'

import type { Product } from '@/payload-types'

import { ProductCatalog } from '@/components/Products/ProductCatalog'
import { Search } from '@/search/Component'
import PageClient from './page.client'

type Args = {
  searchParams: Promise<{ q?: string }>
}

// Typing a category name ("excipients", "API", "food grade") also finds that category
const categoryFor = (query: string): Product['category'] | null => {
  const q = query.toLowerCase()
  if (/\bapis?\b|active pharmaceutical/.test(q)) return 'api'
  if (q.startsWith('excipient')) return 'excipient'
  if (q.startsWith('food')) return 'food-grade'
  return null
}

export default async function Page({ searchParams }: Args) {
  const query = ((await searchParams).q || '').trim().slice(0, 100)
  const payload = await getPayload({ config: configPromise })

  const category = query ? categoryFor(query) : null
  const productWhere: Where | undefined = query
    ? {
        or: [
          ...[
            'title',
            'shortDescription',
            'description',
            'formula',
            'casNumber',
            'grade',
            'packaging',
            'origin',
            'applications.industry',
            'applications.use',
          ].map((field) => ({ [field]: { like: query } })),
          ...(category ? [{ category: { equals: category } }] : []),
        ],
      }
    : undefined

  const [products, pages] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 1,
      limit: 60,
      overrideAccess: false,
      pagination: false,
      sort: ['sortOrder', 'title'],
      where: productWhere,
      select: {
        title: true,
        slug: true,
        category: true,
        availability: true,
        shortDescription: true,
        formula: true,
        grade: true,
        packaging: true,
        images: true,
      },
    }),
    query
      ? payload.find({
          collection: 'pages',
          depth: 0,
          limit: 6,
          overrideAccess: false,
          pagination: false,
          where: {
            and: [
              { slug: { not_equals: 'home' } },
              { or: [{ title: { like: query } }, { 'meta.description': { like: query } }] },
            ],
          },
          select: { title: true, slug: true, meta: { description: true } },
        })
      : Promise.resolve({ docs: [] }),
  ])

  const found = products.docs.length + pages.docs.length

  return (
    <div className="pt-16 pb-24">
      <PageClient />
      <div className="container mb-12">
        <div className="mx-auto max-w-[50rem] text-center">
          <h1 className="mb-8 text-4xl font-bold">Search</h1>
          <Search initialValue={query} />
          <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
            {query
              ? found
                ? `${products.docs.length} product${products.docs.length === 1 ? '' : 's'}${
                    pages.docs.length ? ` and ${pages.docs.length} page${pages.docs.length === 1 ? '' : 's'}` : ''
                  } for “${query}”`
                : ''
              : 'Browse all products below, or type to search.'}
          </p>
        </div>
      </div>

      {pages.docs.length > 0 && (
        <div className="container mb-12">
          <h2 className="mb-4 text-xl font-bold">Pages</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.docs.map((page) => (
              <li key={page.id}>
                <Link
                  className="flex h-full items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
                  href={`/${page.slug}`}
                >
                  <span>
                    <span className="block font-heading font-bold text-heading">{page.title}</span>
                    {page.meta?.description && (
                      <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                        {page.meta.description}
                      </span>
                    )}
                  </span>
                  <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {products.docs.length > 0 ? (
        <>
          {pages.docs.length > 0 && (
            <div className="container">
              <h2 className="mb-4 text-xl font-bold">Products</h2>
            </div>
          )}
          <ProductCatalog hideFilters products={products.docs} />
        </>
      ) : (
        query && (
          <div className="container text-center">
            <p className="mb-4">No products match “{query}”.</p>
            <p className="text-sm text-muted-foreground">
              Try a shorter word, or{' '}
              <Link className="text-primary underline" href="/contact">
                ask us
              </Link>{' '}
              — we source many materials on request.
            </p>
          </div>
        )
      )}
    </div>
  )
}

export async function generateMetadata({ searchParams }: Args): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false } }
}
