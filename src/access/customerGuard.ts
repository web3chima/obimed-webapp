import type { Payload, PayloadRequest } from 'payload'

import { isCustomerUser } from './roles'

// Access rules where a logged-in customer gets more than an anonymous visitor.
// Keep in sync with the allowlist in src/scripts/audit-customer-access.ts.
export const customerRights = new Set([
  'customers.read',
  'customers.update',
  'orders.read',
  'ledger-entries.read',
  'global:invoice-settings.read',
])

// Hide the user from an access function by giving it a view of the request without one
const asAnonymous = (req: PayloadRequest) =>
  new Proxy(req, { get: (target, prop) => (prop === 'user' ? null : Reflect.get(target, prop)) })

type AccessArgs = { req: PayloadRequest } & Record<string, unknown>
type AccessFn = (args: AccessArgs) => unknown

const wrap = (key: string, fn: AccessFn): AccessFn => {
  if (customerRights.has(key)) return fn
  return (args) =>
    isCustomerUser(args.req?.user) ? fn({ ...args, req: asAnonymous(args.req) }) : fn(args)
}

// Payload's behaviour when an access rule is missing: allow anyone logged in
const payloadDefault: AccessFn = ({ req }) => Boolean(req?.user)

// Both rules must pass; query results are combined
const both =
  (first: AccessFn, second: AccessFn): AccessFn =>
  async (args) => {
    const a = await first(args)
    if (!a) return false
    const b = await second(args)
    if (!b) return false
    if (a === true) return b
    if (b === true) return a
    return { and: [a, b] }
  }

const fnOr = (value: unknown) => (typeof value === 'function' ? (value as AccessFn) : undefined)

// Staff roles: editing history follows the update rule when not set (instead of "any logged-in
// user"), and unlocking a document also requires permission to update it
const tightenStaffDefaults = (access: Record<string, unknown>) => {
  const update = fnOr(access.update)
  if (!update) return
  if (!fnOr(access.readVersions)) access.readVersions = update
  access.unlock = both(fnOr(access.unlock) ?? payloadDefault, update)
}

const guardAccess = (
  prefix: string,
  access: Record<string, unknown> | undefined,
  operations: readonly string[],
) => {
  if (!access) return
  tightenStaffDefaults(access)
  for (const op of operations) {
    const fn = fnOr(access[op]) ?? payloadDefault
    access[op] = wrap(`${prefix}.${op}`, fn)
  }
}

const collectionOperations = [
  'create',
  'read',
  'update',
  'delete',
  'readVersions',
  'unlock',
] as const
const globalOperations = ['read', 'update', 'readVersions'] as const

// Payload and its plugins default many access rules to "anyone logged in", which would let
// customers edit content and every staff role read sales history. Called from onInit so it
// also covers Payload's internal collections.
export const guardCustomerAccess = (payload: Payload) => {
  for (const collection of payload.config.collections) {
    guardAccess(collection.slug, collection.access as Record<string, unknown>, collectionOperations)
  }
  for (const global of payload.config.globals) {
    guardAccess(`global:${global.slug}`, global.access as Record<string, unknown>, globalOperations)
  }
}
