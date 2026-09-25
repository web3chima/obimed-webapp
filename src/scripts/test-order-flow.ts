// End-to-end check of customer accounts, separate customer/staff sessions, staff roles, quote
// requests, PO → invoice, the ledger and notification emails, run against a local dev server.
// Creates throwaway customers, staff and orders and deletes them afterwards.
// Run from the project root with the dev server running (and its log in TEST_DEV_LOG to check
// the emails it sends): TEST_DEV_LOG=dev.log bun src/scripts/test-order-flow.ts
import type { Customer } from '@/payload-types'

import { readFile } from 'fs/promises'
import { getPayload } from 'payload'

import config from '@payload-config'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'
const payload = await getPayload({ config })

// Emails sent from this process (local API actions) are recorded here; emails sent by the dev
// server (REST actions) are read from its log
const sent: string[] = []
const originalSendEmail = payload.sendEmail.bind(payload)
payload.sendEmail = async (message) => {
  sent.push(`${String(message.to)} | ${message.subject}`)
  return originalSendEmail(message)
}
const devLogEmails = async () =>
  process.env.TEST_DEV_LOG ? readFile(process.env.TEST_DEV_LOG, 'utf8').catch(() => '') : ''
const emailed = async (subjectPart: string) =>
  sent.some((line) => line.includes(subjectPart)) || (await devLogEmails()).includes(subjectPart)

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

const request = async (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      ...(init.cookie ? { Cookie: init.cookie } : {}),
    },
  })
  const text = await res.text()
  let body: Record<string, any> = {}
  try {
    body = JSON.parse(text)
  } catch {
    // HTML page
  }
  return { status: res.status, body, text, setCookie: res.headers.get('set-cookie') || '' }
}

const cookieFrom = (setCookie: string, name: string) => {
  const value = setCookie.match(new RegExp(`${name}=([^;]+)`))?.[1]
  return value ? `${name}=${value}` : ''
}

// Customers sign in through their own session endpoint and cookie
const customerSignIn = async (email: string, password: string) => {
  const res = await request('/api/customers/session', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return { ...res, cookie: cookieFrom(res.setCookie, 'obimed-customer') }
}

const staffSignIn = async (email: string, password: string) => {
  const res = await request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return cookieFrom(res.setCookie, 'payload-token')
}

const created: { customers: number[]; orders: number[]; users: number[] } = {
  customers: [],
  orders: [],
  users: [],
}

try {
  // 1. Registration cannot self-approve; unapproved accounts cannot sign in
  const a = makeCustomer('a')
  const reg = await request('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ ...a, approved: true, creditDays: 999 }),
  })
  check('register customer', reg.status === 201, `status ${reg.status}`)
  const aId = reg.body?.doc?.id as number
  created.customers.push(aId)
  const fresh = await payload.findByID({ collection: 'customers', id: aId, overrideAccess: true })
  check(
    'registration cannot set approved/creditDays',
    fresh.approved === false && fresh.creditDays === 15,
  )

  const early = await customerSignIn(a.email, a.password)
  check(
    'unapproved customer cannot sign in',
    early.status === 401 &&
      String(early.body?.error).includes('awaiting approval') &&
      !early.cookie,
    `status ${early.status}`,
  )

  // 2. Approve, then sign in with the customer cookie
  await payload.update({
    collection: 'customers',
    id: aId,
    data: { approved: true },
    overrideAccess: true,
  })
  const session = await customerSignIn(a.email, a.password)
  check(
    'approved customer signs in with its own cookie',
    session.status === 200 && Boolean(session.cookie),
  )
  const cookie = session.cookie
  const wrong = await customerSignIn(a.email, 'not-the-password')
  check('wrong password rejected', wrong.status === 401 && !wrong.cookie)

  // 3. The customer cookie gives no Payload API powers
  const pages = await payload.find({
    collection: 'pages',
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })
  const pageId = pages.docs[0]?.id
  const editPage = await request(`/api/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'hacked' }),
    cookie,
  })
  check('customer cookie cannot edit pages', editPage.status === 403, `status ${editPage.status}`)
  const listOrders = await request('/api/orders', { cookie })
  check(
    'customer cookie cannot list orders via the API',
    listOrders.status === 403,
    `status ${listOrders.status}`,
  )
  // Payload's own customer login still exists; the access guard must stop it too
  const legacy = await request('/api/customers/login', {
    method: 'POST',
    body: JSON.stringify({ email: a.email, password: a.password }),
  })
  const legacyCookie = cookieFrom(legacy.setCookie, 'payload-token')
  const legacyHeader = await request('/api/globals/header', {
    method: 'POST',
    body: JSON.stringify({ navItems: [] }),
    cookie: legacyCookie,
  })
  check(
    'customer via Payload login cannot edit the menu',
    legacyHeader.status === 403,
    `status ${legacyHeader.status}`,
  )
  const legacyUsers = await request('/api/users', { cookie: legacyCookie })
  check(
    'customer via Payload login cannot list staff',
    legacyUsers.status === 403,
    `status ${legacyUsers.status}`,
  )

  const pending = makeCustomer('pending')
  const regPendingRes = await request('/api/customers', {
    method: 'POST',
    body: JSON.stringify(pending),
  })
  const regPending = regPendingRes.body?.doc?.id as number
  created.customers.push(regPending)

  // 4. Staff with roles
  const staffPassword = `Staff-${stamp}!`
  const sales = await payload.create({
    collection: 'users',
    data: {
      email: `sales-${stamp}@example.com`,
      password: staffPassword,
      name: 'Test Sales',
      role: 'sales',
    },
    overrideAccess: true,
  })
  const editor = await payload.create({
    collection: 'users',
    data: {
      email: `editor-${stamp}@example.com`,
      password: staffPassword,
      name: 'Test Editor',
      role: 'editor',
    },
    overrideAccess: true,
  })
  created.users.push(sales.id, editor.id)
  const salesCookie = await staffSignIn(sales.email, staffPassword)
  const editorCookie = await staffSignIn(editor.email, staffPassword)
  check('staff sign in', Boolean(salesCookie && editorCookie))

  const salesEditsPage = await request(`/api/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'sales edit' }),
    cookie: salesCookie,
  })
  check('sales cannot edit pages', salesEditsPage.status === 403, `status ${salesEditsPage.status}`)
  const editorOrders = await request('/api/orders', { cookie: editorCookie })
  check('editor cannot see orders', editorOrders.status === 403, `status ${editorOrders.status}`)
  const editorMakesStaff = await request('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      email: `x-${stamp}@example.com`,
      password: 'Xx-12345678',
      role: 'super-admin',
    }),
    cookie: editorCookie,
  })
  check(
    'editor cannot create staff',
    editorMakesStaff.status === 403,
    `status ${editorMakesStaff.status}`,
  )
  const salesPromotesSelf = await request(`/api/users/${sales.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: 'super-admin' }),
    cookie: salesCookie,
  })
  const salesAfter = await payload.findByID({
    collection: 'users',
    id: sales.id,
    overrideAccess: true,
  })
  check(
    'staff cannot promote themselves',
    salesAfter.role === 'sales',
    `status ${salesPromotesSelf.status}`,
  )

  // 5. Staff and customer sessions coexist in one browser
  const bothCookies = `${salesCookie}; ${cookie}`
  const me = await request('/api/users/me', { cookie: bothCookies })
  check('with both cookies, the API sees the staff member', me.body?.user?.id === sales.id)
  const accountPage = await request('/account', { cookie: bothCookies })
  check(
    'with both cookies, /account shows the customer',
    accountPage.status === 200 && accountPage.text.includes(a.company),
    `status ${accountPage.status}`,
  )

  // 6. Submit a quote request (with the staff cookie also present)
  const quote = await request('/api/orders/request', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        { slug: 'sodium-bicarbonate', quantity: 10, unitPrice: 1 },
        { slug: 'citric-acid-anhydrous', quantity: 4 },
      ],
      deliveryLocation: 'Ikeja, Lagos',
    }),
    cookie: bothCookies,
  })
  check(
    'submit quote request',
    quote.status === 201,
    `status ${quote.status} ${quote.body?.error || ''}`,
  )
  const orderId = quote.body?.id as number
  created.orders.push(orderId)
  const orderNumber = quote.body?.orderNumber as string
  check('order number assigned', /^RFQ-\d{4}-\d{4}$/.test(orderNumber || ''), orderNumber)
  const noLogin = await request('/api/orders/request', {
    method: 'POST',
    body: JSON.stringify({ items: [{ slug: 'sodium-bicarbonate', quantity: 1 }] }),
  })
  check(
    'quote request without signing in is refused',
    noLogin.status === 401,
    `status ${noLogin.status}`,
  )

  const stored = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  check(
    'customer cannot set prices when requesting',
    stored.items.every((i) => i.unitPrice == null),
  )

  const earlyPO = await request(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-EARLY' }),
    cookie,
  })
  check('PO rejected before pricing', earlyPO.status === 409, `status ${earlyPO.status}`)

  // 7. Sales staff price the order through the API → status becomes "priced"
  const pricing = await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      items: stored.items.map((item, i) => ({ ...item, unitPrice: i === 0 ? 15000 : 42000.5 })),
    }),
    cookie: salesCookie,
  })
  check('sales staff price the order', pricing.status === 200, `status ${pricing.status}`)
  const priced = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  check('pricing every item sets status to priced', priced.status === 'priced', priced.status)
  check('total calculated', priced.total === 10 * 15000 + 4 * 42000.5, String(priced.total))

  // Order rules: status only moves forward via the right event; requests can't be altered
  const manualPaid = await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'paid' }),
    cookie: salesCookie,
  })
  check(
    'staff cannot mark an order paid by hand',
    manualPaid.status === 400,
    `status ${manualPaid.status}`,
  )
  const manualInvoiced = await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'invoiced' }),
    cookie: salesCookie,
  })
  check(
    'staff cannot mark an order invoiced without a PO',
    manualInvoiced.status === 400,
    `status ${manualInvoiced.status}`,
  )
  await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ items: priced.items.map((item) => ({ ...item, quantity: 999 })) }),
    cookie: salesCookie,
  })
  const afterQty = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })
  check(
    'sales staff cannot change requested quantities',
    afterQty.items.every((i) => i.quantity !== 999),
  )
  const dropItem = await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ items: priced.items.slice(0, 1) }),
    cookie: salesCookie,
  })
  check(
    'sales staff cannot remove requested items',
    dropItem.status === 400,
    `status ${dropItem.status}`,
  )
  const unapprovedOrder = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer: regPending,
      items: [{ product: stored.items[0]!.product, quantity: 1 }],
    }),
    cookie: salesCookie,
  })
  check(
    'staff cannot create orders for unapproved customers',
    unapprovedOrder.status === 400,
    `status ${unapprovedOrder.status}`,
  )
  const manual = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer: aId,
      items: [{ product: stored.items[0]!.product, quantity: 3 }],
    }),
    cookie: salesCookie,
  })
  check(
    'sales staff can enter an order for an approved customer',
    manual.status === 201,
    `status ${manual.status}`,
  )
  if (manual.body?.doc?.id) created.orders.push(manual.body.doc.id)
  const editorCreates = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer: aId,
      items: [{ product: stored.items[0]!.product, quantity: 3 }],
    }),
    cookie: editorCookie,
  })
  check(
    'content editors cannot enter orders',
    editorCreates.status === 403,
    `status ${editorCreates.status}`,
  )
  const unprice = await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      items: priced.items.map((item, i) => ({
        ...item,
        unitPrice: i === 0 ? null : item.unitPrice,
      })),
    }),
    cookie: salesCookie,
  })
  const unpriced = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })
  check(
    'removing a price before the PO reopens pricing',
    unprice.status === 200 && unpriced.status === 'submitted',
    unpriced.status,
  )
  await request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ items: priced.items }),
    cookie: salesCookie,
  })
  const repriced = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })
  check('re-pricing sets status back to priced', repriced.status === 'priced', repriced.status)

  const customerA = (await payload.findByID({
    collection: 'customers',
    id: aId,
    overrideAccess: true,
  })) as Customer
  const asCustomer = { ...customerA, collection: 'customers' as const }
  const hidden = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: false,
    user: asCustomer,
  })
  check(
    'prices hidden from customer before PO',
    hidden.items.every((i) => i.unitPrice == null && i.lineTotal == null) && hidden.total == null,
  )

  // 8. Another customer can't see or PO this order
  const b = makeCustomer('b')
  const regB = await request('/api/customers', { method: 'POST', body: JSON.stringify(b) })
  created.customers.push(regB.body?.doc?.id)
  await payload.update({
    collection: 'customers',
    id: regB.body?.doc?.id,
    data: { approved: true },
    overrideAccess: true,
  })
  const sessionB = await customerSignIn(b.email, b.password)
  const customerB = {
    ...(await payload.findByID({
      collection: 'customers',
      id: regB.body?.doc?.id,
      overrideAccess: true,
    })),
    collection: 'customers' as const,
  }
  const peek = await payload
    .findByID({ collection: 'orders', id: orderId, overrideAccess: false, user: customerB })
    .then(() => 'visible')
    .catch(() => 'blocked')
  check("other customer cannot read someone else's order", peek === 'blocked')
  const peekPage = await request(`/account/orders/${orderId}`, { cookie: sessionB.cookie })
  check(
    "other customer's order page is not found",
    peekPage.status === 404,
    `status ${peekPage.status}`,
  )
  const hijack = await request(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-HIJACK' }),
    cookie: sessionB.cookie,
  })
  check(
    "other customer cannot submit a PO on someone else's order",
    hijack.status === 404,
    `status ${hijack.status}`,
  )

  // 9. Owner submits PO → invoice issued, prices revealed, ledger entry recorded
  const po = await request(`/api/orders/${orderId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-12345' }),
    cookie,
  })
  check('owner submits PO', po.status === 200, `status ${po.status} ${po.body?.error || ''}`)
  const invoiceNumber = po.body?.invoiceNumber as string
  check('invoice number issued', /^INV-\d{4}-\d{4}$/.test(invoiceNumber || ''), invoiceNumber)

  const shown = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: false,
    user: asCustomer,
  })
  check(
    'prices visible after PO',
    shown.total === priced.total && shown.items[0]?.unitPrice === 15000,
  )
  const due = new Date(shown.dueDate!).getTime() - new Date(shown.invoiceDate!).getTime()
  check(
    'due date is 15 days after invoice',
    Math.round(due / 86_400_000) === 15,
    `${due / 86_400_000} days`,
  )
  check('status is invoiced', shown.status === 'invoiced', shown.status)
  const invoicePage = await request(`/account/orders/${orderId}/invoice`, { cookie })
  check(
    'invoice page renders for the customer',
    invoicePage.status === 200 && invoicePage.text.includes(invoiceNumber),
  )

  const again = await request(`/api/orders/${orderId}/po`, {
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
    ledger.totalDocs === 1 &&
      ledger.docs[0]?.amount === priced.total &&
      ledger.docs[0]?.type === 'invoice',
    `${ledger.totalDocs} entries`,
  )
  const myLedger = await payload.find({
    collection: 'ledger-entries',
    overrideAccess: false,
    user: asCustomer,
  })
  check('customer can read own ledger', myLedger.totalDocs === 1)
  const otherLedger = await payload.find({
    collection: 'ledger-entries',
    overrideAccess: false,
    user: customerB,
  })
  check(
    'other customer sees none of it',
    otherLedger.totalDocs === 0,
    String(otherLedger.totalDocs),
  )

  // 10. Delivery, part payment, then full payment → order marked paid automatically
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { status: 'delivered' },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'ledger-entries',
    data: {
      customer: aId,
      order: orderId,
      type: 'payment',
      date: new Date().toISOString(),
      amount: 100000,
      reference: 'TRF-1',
    },
    overrideAccess: true,
  })
  const partPaid = await payload.findByID({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
  })
  check('part payment keeps order open', partPaid.status === 'delivered', partPaid.status)
  await payload.create({
    collection: 'ledger-entries',
    data: {
      customer: aId,
      order: orderId,
      type: 'payment',
      date: new Date().toISOString(),
      amount: priced.total! - 100000,
      reference: 'TRF-2',
    },
    overrideAccess: true,
  })
  const paid = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  check('full payment marks order paid', paid.status === 'paid', paid.status)

  // 10b. Cancelling an invoiced order adds a credit note for what is still owed
  const second = await request('/api/orders/request', {
    method: 'POST',
    body: JSON.stringify({ items: [{ slug: 'xanthan-gum', quantity: 2 }] }),
    cookie,
  })
  const secondId = second.body?.id as number
  created.orders.push(secondId)
  const secondDoc = await payload.findByID({
    collection: 'orders',
    id: secondId,
    overrideAccess: true,
  })
  await payload.update({
    collection: 'orders',
    id: secondId,
    data: { items: secondDoc.items.map((item) => ({ ...item, unitPrice: 50000 })) },
    overrideAccess: true,
  })
  await request(`/api/orders/${secondId}/po`, {
    method: 'POST',
    body: JSON.stringify({ poNumber: 'PO-777' }),
    cookie,
  })
  const cancel = await request(`/api/orders/${secondId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
    cookie: salesCookie,
  })
  const credit = await payload.find({
    collection: 'ledger-entries',
    where: { and: [{ order: { equals: secondId } }, { type: { equals: 'credit-note' } }] },
    overrideAccess: true,
  })
  check(
    'cancelling an invoiced order adds a credit note',
    cancel.status === 200 && credit.totalDocs === 1 && credit.docs[0]?.amount === 100000,
    `status ${cancel.status}, ${credit.totalDocs} credit note(s)`,
  )

  // 11. Signing out revokes the session: the old cookie no longer works
  await request('/api/customers/session', { method: 'DELETE', cookie })
  const afterSignOut = await request('/account', { cookie })
  check(
    'signed-out cookie cannot open the account',
    afterSignOut.status === 307,
    `status ${afterSignOut.status}`,
  )

  // 12. Notifications at every step (wait briefly for the dev server's log to flush)
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const expected: [string, string][] = [
    ['staff told about new registration', `New customer registration: ${a.company}`],
    ['customer told account approved', 'Your Obimed account is approved'],
    ['staff told about quote request', `New quote request ${orderNumber}`],
    ['customer told request received', `We received your quote request ${orderNumber}`],
    ['customer told order priced', `Your order ${orderNumber} is priced`],
    ['customer sent invoice', `Invoice ${invoiceNumber} for PO PO-12345`],
    ['staff told PO received', `PO received: ${invoiceNumber}`],
    ['customer told delivered', `Order ${orderNumber} delivered`],
    ['customer sent payment receipt', 'Payment received'],
    ['customer told paid in full', `Invoice ${invoiceNumber} paid in full`],
  ]
  for (const [label, subject] of expected) check(`email: ${label}`, await emailed(subject), subject)
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
  for (const id of created.users.filter(Boolean)) {
    await payload.delete({ collection: 'users', id, overrideAccess: true }).catch(() => {})
  }
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
