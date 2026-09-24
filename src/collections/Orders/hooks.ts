import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Payload } from 'payload'

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
