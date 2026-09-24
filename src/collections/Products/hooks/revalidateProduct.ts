import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Product } from '../../../payload-types'

export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating product at path: /products/${doc.slug}`)

    revalidatePath('/products')
    revalidatePath(`/products/${doc.slug}`)

    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      revalidatePath(`/products/${previousDoc.slug}`)
    }
  }
  return doc
}

export const revalidateProductDelete: CollectionAfterDeleteHook<Product> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidatePath('/products')
    revalidatePath(`/products/${doc?.slug}`)
  }
  return doc
}
