import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

import { getCustomerFromHeaders } from '@/auth/customerSession'

// The signed-in customer for this request (from the customer session cookie), or null
export const getCustomer = async (): Promise<Customer | null> => {
  const payload = await getPayload({ config: configPromise })
  return getCustomerFromHeaders(payload, await headers())
}
