// Checks that a logged-in customer can't do anything an anonymous visitor can't, except the
// few customer-specific rights listed below. Payload treats a missing access function as
// "anyone logged in", so new collections, globals or plugins can silently open holes.
// Run from the project root: bun src/scripts/audit-customer-access.ts
import type { PayloadRequest } from 'payload'

import { getPayload } from 'payload'

import config from '@payload-config'

// Customer rights beyond anonymous access (see customerRights in src/access/customerGuard.ts).
// Values are the access results we expect.
const allowed: Record<string, string> = {
  'customers.read': 'own',
  'customers.update': 'own',
  'orders.read': 'own',
  'ledger-entries.read': 'own',
  'global:invoice-settings.read': 'true',
}

const describe = (result: unknown) =>
  result === true ? 'true' : result ? JSON.stringify(result) : 'false'

const payload = await getPayload({ config })

const anonymous = { payload, user: null } as unknown as PayloadRequest
const customer = {
  payload,
  user: { id: 999999, collection: 'customers', email: 'audit@example.com' },
} as unknown as PayloadRequest

type AccessFn = (args: { req: PayloadRequest }) => unknown
const run = async (fn: AccessFn | undefined, req: PayloadRequest) =>
  fn ? fn({ req }) : Boolean(req.user) // Payload's default when no access function is set

const problems: string[] = []

const check = async (key: string, fn: AccessFn | undefined) => {
  const asAnonymous = describe(await run(fn, anonymous))
  const asCustomer = describe(await run(fn, customer))
  if (asCustomer === 'false' || asCustomer === asAnonymous) return

  const expected = allowed[key]
  const ok =
    expected === 'own'
      ? asCustomer.includes('999999')
      : expected !== undefined && expected === asCustomer
  if (!ok) problems.push(`${key}: customer=${asCustomer} anonymous=${asAnonymous}`)
}

for (const collection of payload.config.collections) {
  for (const op of ['create', 'read', 'update', 'delete', 'readVersions', 'unlock'] as const) {
    await check(`${collection.slug}.${op}`, collection.access?.[op] as AccessFn | undefined)
  }
}
for (const global of payload.config.globals) {
  for (const op of ['read', 'update', 'readVersions'] as const) {
    await check(`global:${global.slug}.${op}`, global.access?.[op] as AccessFn | undefined)
  }
}

if (problems.length > 0) {
  console.error(`Customer access audit FAILED (${problems.length}):\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('Customer access audit passed: customers only have their intended extra rights.')
process.exit(0)
