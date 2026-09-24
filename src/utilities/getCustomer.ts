import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

// The logged-in customer for this request, or null (staff sessions don't count)
export const getCustomer = async (): Promise<Customer | null> => {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  return user?.collection === 'customers' ? (user as Customer) : null
}
