import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProcessSlider } from '@/components/Products/ProcessSlider'
import { ProductCatalog } from '@/components/Products/ProductCatalog'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function ProductsPage() {
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: ['sortOrder', 'title'],
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
  })

  return (
    <div className="pt-16 pb-32">
      <ProcessSlider />
      <div className="pt-16">
        <ProductCatalog products={products.docs} />
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Products: Excipients, Food-Grade Raw Materials & APIs',
    description:
      'Sodium bicarbonate, dextrose, xanthan gum, citric acid, MSG and more. Food-grade raw materials and excipients supplied in 25 kg bags across Nigeria. Add products to a quote.',
  }
}
