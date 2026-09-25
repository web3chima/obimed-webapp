import type { Payload } from 'payload'

import { jwtVerify } from 'jose'

import type { Customer } from '@/payload-types'

// Customers keep their session in their own cookie instead of Payload's shared `payload-token`,
// so signing in as a customer never replaces a staff member's admin session (and vice versa).
// This cookie is only read by the customer pages and endpoints; it grants no Payload API access.
export const CUSTOMER_COOKIE = 'obimed-customer'

type Session = { id: string; expiresAt: string | Date }

const readCookie = (headers: Headers, name: string) => {
  const cookie = headers.get('cookie') || ''
  const match = cookie.split(/;\s*/).find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

// The signed-in customer for these request headers, or null. Mirrors Payload's own JWT checks:
// valid signature, a customer account, an unexpired session, and an approved account.
export const getCustomerFromHeaders = async (
  payload: Payload,
  headers: Headers,
): Promise<Customer | null> => {
  const token = readCookie(headers, CUSTOMER_COOKIE)
  if (!token) return null

  try {
    const { payload: claims } = await jwtVerify(token, new TextEncoder().encode(payload.secret))
    if (claims.collection !== 'customers' || !claims.id || !claims.sid) return null

    const customer = await payload.findByID({
      collection: 'customers',
      id: claims.id as number,
      depth: 0,
      overrideAccess: true,
    })
    const sessions = ((customer as { sessions?: Session[] }).sessions || []).filter(
      (session) => new Date(session.expiresAt) > new Date(),
    )
    if (!customer.approved || !sessions.some((session) => session.id === claims.sid)) return null

    return { ...customer, collection: 'customers' } as Customer
  } catch {
    return null
  }
}

export const sessionCookie = (token: string, maxAgeSeconds: number) =>
  [
    `${CUSTOMER_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

// Removes the session behind this cookie so the token can't be reused after signing out
export const endCustomerSession = async (payload: Payload, headers: Headers) => {
  const token = readCookie(headers, CUSTOMER_COOKIE)
  if (!token) return
  try {
    const { payload: claims } = await jwtVerify(token, new TextEncoder().encode(payload.secret))
    if (claims.collection !== 'customers' || !claims.id) return
    const raw = (await payload.db.findOne({
      collection: 'customers',
      where: { id: { equals: claims.id } },
    })) as { sessions?: Session[] } | null
    if (!raw?.sessions) return
    await payload.db.updateOne({
      collection: 'customers',
      id: claims.id as number,
      data: { sessions: raw.sessions.filter((session) => session.id !== claims.sid) },
    })
  } catch {
    // Invalid or expired token: nothing to revoke
  }
}
