import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

// One of the customer's own orders, with access rules applied (prices hidden until a PO is entered)
export const getCustomerOrder = async (customer: Customer, id: string) => {
  const orderId = Number(id)
  if (!Number.isInteger(orderId)) return null

  const payload = await getPayload({ config: configPromise })
  return payload
    .findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: false,
      user: customer,
    })
    .catch(() => null)
}
