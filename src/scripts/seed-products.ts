// Creates or updates the Obimed product catalog. Images and documents added in the admin
// are left untouched.
// Run from the project root (with the dev server stopped, then start it again):
// bun src/scripts/seed-products.ts
import { getPayload } from 'payload'

import config from '@payload-config'
import { clearNextCache } from './clearNextCache'
import { obimedProducts } from '@/endpoints/seed/obimed-products'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

for (const product of obimedProducts) {
  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: product.slug } },
    limit: 1,
    pagination: false,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'products',
      id: existing.docs[0].id,
      data: product,
      context,
    })
    payload.logger.info(`Updated ${product.title}`)
  } else {
    await payload.create({ collection: 'products', data: product, context })
    payload.logger.info(`Created ${product.title}`)
  }
}

await clearNextCache()
process.exit(0)
