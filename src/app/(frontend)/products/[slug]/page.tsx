import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import { ChevronRightIcon, FileDownIcon, MessageCircleIcon } from 'lucide-react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { AddToQuoteButton } from '@/components/Products/AddToQuoteButton'
import { categoryLabels, ProductCatalog } from '@/components/Products/ProductCatalog'
import { ProductVisual } from '@/components/Products/ProductVisual'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { siteConfig } from '@/utilities/siteConfig'

export const dynamic = 'force-static'
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
  })

  return products.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{ slug?: string }>
}

export default async function ProductPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const product = await queryProductBySlug({ slug: decodeURIComponent(slug) })

  if (!product) notFound()

  const comingSoon = product.availability === 'coming-soon'
  const images = (product.images || []).filter(
    (img): img is MediaType => typeof img === 'object' && img !== null,
  )

  const specs = [
    { label: 'Chemical formula', value: product.formula },
    { label: 'CAS number', value: product.casNumber },
    { label: 'Grade', value: product.grade },
    { label: 'Packaging', value: product.packaging },
    { label: 'Origin', value: product.origin },
  ].filter((row) => row.value)

  const related = await getRelated(product.category, product.id)

  const whatsappText = encodeURIComponent(
    `Hello Obimed, I have a question about ${product.title}.`,
  )

  return (
    <article className="pt-8 pb-32">
      <div className="container">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1 text-sm">
          <Link href="/products" className="text-primary hover:underline">
            Products
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <span aria-current="page" className="text-muted-foreground">
            {product.title}
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-3">
            <div className="group overflow-hidden rounded-2xl border border-border">
              <ProductVisual className="aspect-square" priority product={product} size="large" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(1, 5).map((image) => (
                  <div
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card"
                    key={image.id}
                  >
                    <Media fill imgClassName="object-contain p-2" resource={image} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
              {categoryLabels[product.category]}
              {comingSoon && ' · Coming soon'}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{product.title}</h1>
            <p className="mt-4 text-lg leading-relaxed">{product.shortDescription}</p>

            {specs.length > 0 && (
              <table className="mt-8 w-full overflow-hidden rounded-xl border border-border text-sm">
                <caption className="sr-only">Specifications</caption>
                <tbody>
                  {specs.map((row, i) => (
                    <tr className={i % 2 === 0 ? 'bg-card' : undefined} key={row.label}>
                      <th
                        className="w-2/5 px-4 py-3 text-left font-heading font-semibold text-heading"
                        scope="row"
                      >
                        {row.label}
                      </th>
                      <td className="px-4 py-3">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <AddToQuoteButton
                disabled={comingSoon}
                packaging={product.packaging}
                size="lg"
                slug={product.slug}
                title={product.title}
              />
              <Button asChild size="lg" variant="outline">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <MessageCircleIcon />
                  Ask on WhatsApp
                </a>
              </Button>
            </div>

            {product.documents && product.documents.length > 0 && (
              <ul className="mt-8 flex flex-col gap-2">
                {product.documents.map((doc) =>
                  typeof doc.file === 'object' && doc.file?.url ? (
                    <li key={doc.id}>
                      <a
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        href={getMediaUrl(doc.file.url, doc.file.updatedAt)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <FileDownIcon className="h-4 w-4" />
                        {doc.label}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </div>
        </div>

        {product.description && (
          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">About {product.title}</h2>
            <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {product.applications && product.applications.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Who uses it</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.applications.map((app) => (
                <li
                  className="rounded-xl border border-border bg-card p-5 border-t-4 border-t-brand-green"
                  key={app.id}
                >
                  <h3 className="font-heading font-bold">{app.industry}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{app.use}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <div className="container mb-6">
            <h2 className="text-2xl font-bold">Related products</h2>
          </div>
          <ProductCatalog hideFilters products={related} />
        </section>
      )}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const product = await queryProductBySlug({ slug: decodeURIComponent(slug) })

  if (!product) return {}

  return {
    title: `${product.title}${product.grade ? ` (${product.grade})` : ''}`,
    description: product.shortDescription,
  }
}

const queryProductBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs?.[0] || null
})

const getRelated = async (category: string, excludeId: number) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 4,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder',
    where: {
      and: [{ category: { equals: category } }, { id: { not_equals: excludeId } }],
    },
  })

  return result.docs
}
