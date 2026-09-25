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

// Entering a PO number on a priced order issues the invoice
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

  const customerId = typeof data.customer === 'object' ? data.customer?.id : data.customer
  const customer = customerId
    ? await req.payload.findByID({
        collection: 'customers',
        id: customerId,
        depth: 0,
        overrideAccess: true,
        req,
      })
    : null
  const creditDays = customer?.creditDays ?? 15

  const invoiceDate = new Date()
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + creditDays)

  data.poNumber = poNumber
  data.invoiceNumber = await nextNumber(req.payload, 'invoiceNumber', 'INV')
  data.invoiceDate = invoiceDate.toISOString()
  data.dueDate = dueDate.toISOString()
  data.status = 'invoiced'
  return data
}

// Record each newly issued invoice in the customer's ledger (once)
export const recordInvoiceInLedger: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!doc.invoiceNumber || previousDoc?.invoiceNumber) return doc

  const customer = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
  await req.payload.create({
    collection: 'ledger-entries',
    data: {
      customer,
      order: doc.id,
      type: 'invoice',
      amount: doc.total ?? 0,
      date: doc.invoiceDate ?? new Date().toISOString(),
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
// Priced ← all items priced, Invoiced ← PO entered, Paid ← ledger settles the invoice.
// Staff may set Delivered (after invoicing) or Cancelled (a credit note is added once invoiced).
const allowedNext: Record<Order['status'], Order['status'][]> = {
  submitted: ['priced', 'cancelled'],
  priced: ['submitted', 'invoiced', 'cancelled'],
  invoiced: ['delivered', 'paid', 'cancelled'],
  delivered: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
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

// Cancelling an invoiced order credits whatever is still owed on it, so the balance is right
export const creditCancelledInvoice: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc.status !== 'cancelled' || previousDoc?.status === 'cancelled' || !doc.invoiceNumber) {
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
        note: `Cancellation of ${doc.invoiceNumber}`,
      },
      overrideAccess: true,
      req,
    })
  }
  return doc
}
