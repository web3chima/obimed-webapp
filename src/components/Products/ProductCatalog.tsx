'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { ArrowRightIcon, FlaskConicalIcon } from 'lucide-react'

import type { Product } from '@/payload-types'

import { cn } from '@/utilities/ui'
import { AddToQuoteButton } from './AddToQuoteButton'
import { ProductVisual } from './ProductVisual'

export type CatalogProduct = Pick<
  Product,
  | 'id'
  | 'title'
  | 'slug'
  | 'category'
  | 'availability'
  | 'shortDescription'
  | 'formula'
  | 'grade'
  | 'packaging'
  | 'images'
>

const filters = [
  { label: 'All products', value: 'all' },
  { label: 'Excipients', value: 'excipient' },
  { label: 'Food-grade', value: 'food-grade' },
  { label: 'APIs', value: 'api' },
] as const

type Filter = (typeof filters)[number]['value']

export const categoryLabels: Record<Product['category'], string> = {
  api: 'API',
  excipient: 'Excipient',
  'food-grade': 'Food-grade',
}

export const ProductCatalog: React.FC<{ hideFilters?: boolean; products: CatalogProduct[] }> = ({
  hideFilters,
  products,
}) => {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = products.filter((p) => filter === 'all' || p.category === filter)
  const hasApis = products.some((p) => p.category === 'api' && p.availability === 'available')
  const showApiTeaser = !hideFilters && !hasApis && (filter === 'all' || filter === 'api')

  return (
    <div className="container">
      {!hideFilters && (
        <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter products">
          {filters.map(({ label, value }) => (
            <button
              aria-pressed={filter === value}
              className={cn(
                'rounded-full border px-4 py-2 font-heading text-sm font-semibold transition-colors',
                filter === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-heading hover:border-primary hover:text-primary',
              )}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible
          .filter((p) => !(p.category === 'api' && p.availability !== 'available'))
          .map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        {showApiTeaser && (
          <li className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <ApiComingSoon />
          </li>
        )}
      </ul>

      {visible.length === 0 && !showApiTeaser && (
        <p className="py-12 text-center">No products in this category yet.</p>
      )}
    </div>
  )
}

const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const href = `/products/${product.slug}`
  const comingSoon = product.availability === 'coming-soon'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <ProductVisual className="aspect-[4/3]" product={product} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider',
              product.category === 'food-grade'
                ? 'bg-brand-green/20 text-brand-green-ink'
                : 'bg-accent text-accent-foreground',
            )}
          >
            {categoryLabels[product.category]}
          </span>
          {comingSoon && (
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
              Coming soon
            </span>
          )}
        </div>
        <h2 className="font-heading text-lg font-bold leading-snug">
          <Link href={href} className="hover:text-primary transition-colors">
            {product.title}
          </Link>
        </h2>
        {(product.formula || product.packaging) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {[product.formula, product.packaging].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed line-clamp-3">{product.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-primary"
          >
            Details
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <AddToQuoteButton
            disabled={comingSoon}
            packaging={product.packaging}
            size="sm"
            slug={product.slug}
            title={product.title}
          />
        </div>
      </div>
    </article>
  )
}

const ApiComingSoon: React.FC = () => (
  <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-accent p-8 md:p-10">
    <span
      aria-hidden
      className="animate-shimmer pointer-events-none absolute inset-0 animate-[shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"
    />
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FlaskConicalIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-green-ink">
            Coming soon
          </p>
          <h2 className="font-heading text-xl font-bold">
            Active Pharmaceutical Ingredients (APIs)
          </h2>
          <p className="mt-1 max-w-xl text-sm">
            Our API catalog is on the way. Tell us what you need today and we will source it for
            you.
          </p>
        </div>
      </div>
      <Link
        href="/quote"
        className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-primary"
      >
        Request an API
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  </div>
)
