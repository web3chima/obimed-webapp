// End-to-end check of customer accounts, quote requests, PO → invoice and the ledger, run
// against a local dev server. Creates throwaway customers/orders and deletes them afterwards.
// Run from the project root with the dev server running: bun src/scripts/test-order-flow.ts
import { getPayload } from 'payload'

import config from '@payload-config'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const payload = await getPayload({ config })

let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures++
}

const stamp = Date.now()
const makeCustomer = (tag: string) => ({
  email: `test-${tag}-${stamp}@example.com`,
  password: `Pw-${stamp}-${tag}!`,
  company: `Test Co ${tag}`,
  name: `Tester ${tag}`,
  phone: '08000000000',
})

const api = async (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.cookie ? { Cookie: init.cookie } : {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body, setCookie: res.headers.get('set-cookie') || '' }
}

const login = async (email: string, password: string) => {
  const res = await api('/api/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const token = res.setCookie.match(/payload-token=([^;]+)/)?.[1]
  return { ...res, cookie: token ? `payload-token=${token}` : '' }
}

const created: { customers: number[]; orders: number[] } = { customers: [], orders: [] }

try {
  // 1. Registration cannot self-approve; unapproved accounts cannot log in
  const a = makeCustomer('a')
  const reg = await api('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ ...a, approved: true, creditDays: 999 }),
  })
  check('register customer', reg.status === 201, `status ${reg.status}`)
  const aId = reg.body?.doc?.id as number
  created.customers.push(aId)
  const fresh = await payload.findByID({ collection: 'customers', id: aId, overrideAccess: true })
  check('registration cannot set approved/creditDays', fresh.approved === false && fresh.creditDays === 15)

  const early = await login(a.email, a.password)
  check('unapproved customer cannot log in', early.status === 403, `status ${early.status}`)

  // 2. Approve, then log in
  await payload.update({ collection: 'customers', id: aId, data: { approved: true }, overrideAccess: true })
  const session = await login(a.email, a.password)
  check('approved customer can log in', session.status === 200 && Boolean(session.cookie))
  const cookie = session.cookie

  // 3. Customers cannot touch site content or write orders directly
  const pages = await payload.find({ collection: 'pages', limit: 1, overrideAccess: true, depth: 0 })
  const pageId = pages.docs[0]?.id
  const editPage = await api(`/api/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'hacked' }),
    cookie,
  })
  check('customer cannot edit pages', editPage.status === 403, `status ${editPage.status}`)
  const header = await api('/api/globals/header', {
    method: 'POST',
    body: JSON.stringify({ navItems: [] }),
    cookie,
  })
  check('customer cannot edit the header menu', header.status === 403, `status ${header.status}`)
  const directOrder = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ customer: aId, items: [] }),
    cookie,
  })
  check('customer cannot create orders directly', directOrder.status === 403, `status ${directOrder.status}`)
  const staffList = await api('/api/users', { cookie })
  check('customer cannot list staff users', staffList.status === 403, `status ${staffList.status}`)

  // 4. Submit a quote request through the endpoint
  const request = await api('/api/orders/request', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        { slug: 'sodium-bicarbonate', quantity: 10, unitPrice: 1 },
        { slug: 'citric-acid-anhydrous', quantity: 4 },
      ],
      deliveryLocation: 'Ikeja, Lagos',
    }),
    cookie,
  })
  check('submit quote request', request.status === 201, `status ${request.status} ${request.body?.error || ''}`)
  const orderId = request.body?.id as number
  created.orders.push(orderId)
  check('order number assigned', /^RFQ-\d{4}-\d{4}$/.test(request.body?.orderNumber || ''), request.body?.orderNumber)

  const stored = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  check('customer cannot set prices when requesting', stored.items.every((i) => i.unitPrice == null))

  const earlyPO = await api(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-EARLY' }),
    cookie,
  })
  check('PO rejected before pricing', earlyPO.status === 409, `status ${earlyPO.status}`)

  // 5. Staff price the order → status becomes "priced"; customer still can't see prices
  const priced = await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: {
      items: stored.items.map((item, i) => ({ ...item, unitPrice: i === 0 ? 15000 : 42000.5 })),
    },
  })
  check('pricing every item sets status to priced', priced.status === 'priced', priced.status)
  check('total calculated', priced.total === 10 * 15000 + 4 * 42000.5, String(priced.total))

  const hidden = await api(`/api/orders/${orderId}`, { cookie })
  const hiddenItems = hidden.body?.items || []
  check(
    'prices hidden from customer before PO',
    hidden.status === 200 &&
      hiddenItems.every((i: Record<string, unknown>) => !('unitPrice' in i) && !('lineTotal' in i)) &&
      !('total' in hidden.body),
  )

  // 6. Another customer can't see or PO this order
  const b = makeCustomer('b')
  const regB = await api('/api/customers', { method: 'POST', body: JSON.stringify(b) })
  created.customers.push(regB.body?.doc?.id)
  await payload.update({
    collection: 'customers',
    id: regB.body?.doc?.id,
    data: { approved: true },
    overrideAccess: true,
  })
  const sessionB = await login(b.email, b.password)
  const peek = await api(`/api/orders/${orderId}`, { cookie: sessionB.cookie })
  check("other customer cannot read someone else's order", peek.status === 404 || peek.status === 403, `status ${peek.status}`)
  const hijack = await api(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-HIJACK' }),
    cookie: sessionB.cookie,
  })
  check("other customer cannot submit a PO on someone else's order", hijack.status === 404, `status ${hijack.status}`)

  // 7. Owner submits PO → invoice issued, prices revealed, ledger entry recorded
  const po = await api(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-12345' }),
    cookie,
  })
  check('owner submits PO', po.status === 200, `status ${po.status} ${po.body?.error || ''}`)
  check('invoice number issued', /^INV-\d{4}-\d{4}$/.test(po.body?.invoiceNumber || ''), po.body?.invoiceNumber)

  const shown = await api(`/api/orders/${orderId}`, { cookie })
  check(
    'prices visible after PO',
    shown.body?.total === priced.total && shown.body?.items?.[0]?.unitPrice === 15000,
  )
  const due = new Date(shown.body?.dueDate).getTime() - new Date(shown.body?.invoiceDate).getTime()
  check('due date is 15 days after invoice', Math.round(due / 86_400_000) === 15, `${due / 86_400_000} days`)
  check('status is invoiced', shown.body?.status === 'invoiced', shown.body?.status)

  const again = await api(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-AGAIN' }),
    cookie,
  })
  check('second PO rejected', again.status === 409, `status ${again.status}`)

  const ledger = await payload.find({
    collection: 'ledger-entries',
    where: { order: { equals: orderId } },
    overrideAccess: true,
  })
  check(
    'one ledger entry for the invoice',
    ledger.totalDocs === 1 && ledger.docs[0]?.amount === priced.total && ledger.docs[0]?.type === 'invoice',
    `${ledger.totalDocs} entries`,
  )
  const myLedger = await api('/api/ledger-entries', { cookie })
  check('customer can read own ledger', myLedger.status === 200 && myLedger.body?.totalDocs === 1)
  const otherLedger = await api('/api/ledger-entries', { cookie: sessionB.cookie })
  check("other customer sees none of it", otherLedger.body?.totalDocs === 0, String(otherLedger.body?.totalDocs))
} finally {
  // Clean up everything this test created
  for (const id of created.orders.filter(Boolean)) {
    await payload.delete({
      collection: 'ledger-entries',
      where: { order: { equals: id } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'orders', id, overrideAccess: true }).catch(() => {})
  }
  for (const id of created.customers.filter(Boolean)) {
    await payload.delete({ collection: 'customers', id, overrideAccess: true }).catch(() => {})
  }
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
