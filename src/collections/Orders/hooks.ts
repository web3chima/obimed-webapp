import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Payload } from 'payload'

import { APIError } from 'payload'

import { isSuperAdmin } from '@/access/roles'
import { orderBalance } from '@/collections/LedgerEntries/balance'

import type { Order } from '@/payload-types'

import {
  notifyInvoiceIssued,
  notifyOrderPriced,
  notifyOrderSubmitted,
  notifyStatusChange,
} from '@/notifications'

type Item = NonNullable<Order['items']>[number]

const isPriced = (item: Item) => typeof item.unitPrice === 'number' && item.unitPrice >= 0

// Next sequential number for this year, e.g. RFQ-2026-0007 or INV-2026-0003. Based on the
// highest existing number (not a count), so deleting an order never causes a duplicate.
export const nextNumber = async (
  payload: Payload,
  field: 'orderNumber' | 'invoiceNumber',
  prefix: 'RFQ' | 'INV',
) => {
  const start = `${prefix}-${new Date().getFullYear()}-`
  const { docs } = await payload.find({
    collection: 'orders',
    where: { [field]: { like: start } },
    sort: `-${field}`,
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { [field]: true },
  })
  const last = Number(String(docs[0]?.[field] ?? '').slice(start.length)) || 0
  return `${start}${String(last + 1).padStart(4, '0')}`
}

// Line totals and order total; move a submitted order to "priced" once every item has a price
export const calculateTotals: CollectionBeforeChangeHook<Order> = ({ data }) => {
  const items = (data.items || []) as Item[]
  let total = 0

  for (const item of items) {
    if (isPriced(item)) {
      item.lineTotal = Math.round(item.unitPrice! * (item.quantity || 0) * 100) / 100
      total += item.lineTotal
    } else {
      item.lineTotal = null
    }
  }

  const allPriced = items.length > 0 && items.every(isPriced)
  data.total = allPriced ? Math.round(total * 100) / 100 : null

  if (data.status === 'submitted' && allPriced) data.status = 'priced'
  // A price was removed before the PO arrived: back to awaiting prices
  if (data.status === 'priced' && !allPriced && !data.poNumber) data.status = 'submitted'
  return data
}

export const INVOICE_VALIDITY_DAYS = 7

const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const invoiceHasLapsed = (order: Pick<Order, 'status' | 'invoiceValidUntil'>) =>
  order.status === 'invoiced' &&
  Boolean(order.invoiceValidUntil) &&
  new Date(order.invoiceValidUntil!) < new Date()

// Any payment received on an order stops its invoice expiring
export const hasPayments = async (
  payload: Payload,
  orderId: number,
  req?: Parameters<CollectionAfterChangeHook>[0]['req'],
) => {
  const { totalDocs } = await payload.count({
    collection: 'ledger-entries',
    where: { and: [{ order: { equals: orderId } }, { type: { equals: 'payment' } }] },
    overrideAccess: true,
    req,
  })
  return totalDocs > 0
}

// Entering a PO number on a priced order issues the invoice, valid for 7 days until delivery
export const issueInvoiceOnPO: CollectionBeforeChangeHook<Order> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const poNumber = data.poNumber?.trim()
  const alreadyInvoiced = Boolean(originalDoc?.invoiceNumber || data.invoiceNumber)
  if (operation !== 'update' || !poNumber || alreadyInvoiced || data.status !== 'priced') {
    return data
  }

  const invoiceDate = new Date()

  data.poNumber = poNumber
  data.invoiceNumber = await nextNumber(req.payload, 'invoiceNumber', 'INV')
  data.invoiceDate = invoiceDate.toISOString()
  data.invoiceValidUntil = addDays(invoiceDate, INVOICE_VALIDITY_DAYS).toISOString()
  // The payment due date is set when the goods are delivered
  data.dueDate = null
  data.status = 'invoiced'
  return data
}

// Record the invoice in the customer's ledger when its goods are delivered (once)
export const recordInvoiceInLedger: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
}) => {
  // The invoice becomes owed when the goods are delivered, not when it is issued
  if (doc.status !== 'delivered' || previousDoc?.status === 'delivered' || !doc.invoiceNumber) {
    return doc
  }

  const customer = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
  await req.payload.create({
    collection: 'ledger-entries',
    data: {
      customer,
      order: doc.id,
      type: 'invoice',
      amount: doc.total ?? 0,
      date: doc.deliveredAt ?? new Date().toISOString(),
      reference: doc.invoiceNumber,
      note: `PO ${doc.poNumber}`,
    },
    overrideAccess: true,
    req,
  })
  return doc
}

export const assignOrderNumber: CollectionBeforeChangeHook<Order> = async ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create' && !data.orderNumber) {
    data.orderNumber = await nextNumber(req.payload, 'orderNumber', 'RFQ')
  }
  return data
}

// Email the customer and/or staff at each step of the order's life
export const notifyOrderChanges: CollectionAfterChangeHook<Order> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const { payload } = req
  if (operation === 'create') {
    await notifyOrderSubmitted(payload, doc)
  } else if (doc.invoiceNumber && !previousDoc?.invoiceNumber) {
    await notifyInvoiceIssued(payload, doc)
  } else if (doc.status !== previousDoc?.status) {
    if (doc.status === 'priced') await notifyOrderPriced(payload, doc)
    else await notifyStatusChange(payload, doc)
  }
  return doc
}

// Status only moves forward, and only the right event can move it:
// Priced ← all items priced, Invoiced ← PO entered, Expired ← invoice not delivered within
// 7 days, Paid ← fully paid after delivery. Staff may set Delivered (while the invoice is
// valid) or Cancelled (a credit note is added once invoiced).
const allowedNext: Record<Order['status'], Order['status'][]> = {
  submitted: ['priced', 'cancelled'],
  priced: ['submitted', 'invoiced', 'cancelled'],
  invoiced: ['delivered', 'cancelled', 'expired'],
  delivered: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
  expired: [],
}

const reject = (message: string) => {
  throw new APIError(message, 400, undefined, true)
}

type LockedItem = { product?: unknown; quantity?: unknown }
const itemKey = (item: LockedItem) =>
  `${typeof item.product === 'object' && item.product ? (item.product as { id: number }).id : item.product}:${item.quantity}`

export const enforceOrderRules: CollectionBeforeChangeHook<Order> = async ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  // Orders are only for approved customer accounts (covers orders entered by staff)
  if (operation === 'create') {
    const customerId = typeof data.customer === 'object' ? data.customer?.id : data.customer
    const customer = customerId
      ? await req.payload
          .findByID({
            collection: 'customers',
            id: customerId,
            depth: 0,
            overrideAccess: true,
            req,
          })
          .catch(() => null)
      : null
    if (!customer?.approved) reject('Orders can only be created for approved customer accounts.')
    return data
  }
  if (!originalDoc) return data

  const before = originalDoc.status
  const after = data.status ?? before
  if (after !== before) {
    if (!allowedNext[before].includes(after)) {
      reject(`An order can't go from "${before}" to "${after}".`)
    }
    if (after === 'invoiced' && !data.invoiceNumber) {
      reject('Invoices are issued when the customer (or you) enters the PO number.')
    }
    if (after === 'paid' && !context?.settledByLedger) {
      reject('Record the payment in Sales → Ledger; the order becomes Paid once fully paid.')
    }
    if (after === 'expired' && !context?.expiredBySchedule) {
      reject('Invoices expire automatically when goods are not delivered within 7 days.')
    }
    if (
      after === 'delivered' &&
      invoiceHasLapsed(originalDoc) &&
      !(await hasPayments(req.payload, originalDoc.id, req))
    ) {
      reject(
        `Invoice ${originalDoc.invoiceNumber} expired on its 7-day validity and can no longer be delivered. The customer can submit a new request.`,
      )
    }
  }

  // Products and quantities: only a super admin, and only while the order awaits prices
  if (data.items) {
    const unchanged =
      data.items.length === originalDoc.items.length &&
      data.items.every((item, i) => itemKey(item) === itemKey(originalDoc.items[i]!))
    if (!unchanged && !(isSuperAdmin(req.user) && before === 'submitted')) {
      reject(
        "Products and quantities can't be changed. Cancel the order so the customer can resubmit, or ask a super admin (possible only while it awaits prices).",
      )
    }
  }

  if (
    originalDoc.poNumber &&
    data.poNumber !== undefined &&
    data.poNumber !== originalDoc.poNumber
  ) {
    reject("The PO number can't be changed once the invoice is issued.")
  }

  if (before !== 'submitted' && before !== 'priced' && data.items) {
    const pricesChanged = data.items.some(
      (item, i) => item.unitPrice !== originalDoc.items[i]?.unitPrice,
    )
    if (pricesChanged) reject("Prices can't be changed once the invoice is issued.")
  }

  return data
}

// Cancelling a delivered order credits whatever is still owed, so the balance is right
export const creditCancelledInvoice: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
}) => {
  // Only a delivered invoice was ever owed; before delivery nothing needs reversing and any
  // payment simply stays as credit on the customer's account
  if (doc.status !== 'cancelled' || previousDoc?.status !== 'delivered') {
    return doc
  }
  const outstanding = await orderBalance(req.payload, doc.id, req)
  if (outstanding > 0) {
    await req.payload.create({
      collection: 'ledger-entries',
      data: {
        customer: typeof doc.customer === 'object' ? doc.customer.id : doc.customer,
        order: doc.id,
        type: 'credit-note',
        amount: outstanding,
        date: new Date().toISOString(),
        reference: `CN-${doc.invoiceNumber}`,
        note: `Cancellation of ${doc.invoiceNumber} after delivery`,
      },
      overrideAccess: true,
      req,
    })
  }
  return doc
}

// Marking an order delivered records when, and starts the payment terms from that moment
export const scheduleDueDateOnDelivery: CollectionBeforeChangeHook<Order> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (data.status !== 'delivered' || originalDoc?.status === 'delivered') return data

  const customerId = typeof data.customer === 'object' ? data.customer?.id : data.customer
  const customer = customerId
    ? await req.payload
        .findByID({ collection: 'customers', id: customerId, depth: 0, overrideAccess: true, req })
        .catch(() => null)
    : null

  const deliveredAt = new Date()
  data.deliveredAt = deliveredAt.toISOString()
  data.dueDate = addDays(deliveredAt, customer?.creditDays ?? 15).toISOString()
  return data
}

// An order becomes Paid once it is delivered and nothing is owed on it (payments may arrive
// before or after delivery)
export const markPaidWhenSettled = async (
  payload: Payload,
  orderId: number,
  req?: Parameters<CollectionAfterChangeHook>[0]['req'],
) => {
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (order.status !== 'delivered') return
  if ((await orderBalance(payload, orderId, req)) > 0) return
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { status: 'paid' },
    overrideAccess: true,
    context: { settledByLedger: true },
    req,
  })
}

export const settleOnDelivery: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc.status === 'delivered' && previousDoc?.status !== 'delivered') {
    await markPaidWhenSettled(req.payload, doc.id, req)
  }
  return doc
}

// Expire unpaid invoices whose goods weren't delivered within 7 days (run daily by Vercel Cron).
// Nothing to reverse: an invoice only becomes owed on delivery.
export const expireLapsedInvoices = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { status: { equals: 'invoiced' } },
        { invoiceValidUntil: { less_than: new Date().toISOString() } },
      ],
    },
    limit: 200,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const expired: string[] = []
  for (const order of docs) {
    if (await hasPayments(payload, order.id)) continue
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'expired' },
      overrideAccess: true,
      context: { expiredBySchedule: true },
    })
    expired.push(order.orderNumber!)
  }
  return expired
}
