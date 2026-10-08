import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  FieldAccess,
} from 'payload'

import { APIError } from 'payload'

import type { LedgerEntry } from '@/payload-types'

import { notifyGoodsReturned, notifyPaymentReceived } from '@/notifications'
import { syncPaidStatus } from '@/collections/Orders/hooks'

import { customerBalance, orderBalance } from './balance'

const reject = (message: string) => {
  throw new APIError(message, 400, undefined, true)
}

const idOf = (value: unknown) =>
  value && typeof value === 'object' ? (value as { id: number }).id : (value as number | null)

// Invoice entries (written on delivery), returned-goods credit notes and their refunds are fixed
// once recorded; staff can only add notes. Delete a return entry to undo it.
const isLocked = (doc?: Partial<LedgerEntry> | null) =>
  doc?.type === 'invoice' || doc?.type === 'return' || Boolean(doc?.returnOf)
export const lockedOnInvoices: FieldAccess<LedgerEntry> = ({ doc }) => !isLocked(doc)

// Invoices are only ever added by the system, and an entry's customer must match its order
export const protectLedgerEntries: CollectionBeforeChangeHook<LedgerEntry> = async ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!context?.systemEntry) {
    if (isLocked(originalDoc)) {
      const changed = (
        ['type', 'amount', 'customer', 'order', 'date', 'product', 'bags', 'settlement'] as const
      ).some(
        (field) =>
          data[field] !== undefined &&
          (field === 'customer' || field === 'order' || field === 'product'
            ? idOf(data[field]) !== idOf(originalDoc![field])
            : data[field] !== originalDoc![field]),
      )
      if (changed) {
        reject(
          originalDoc?.type === 'invoice'
            ? 'This invoice entry was added automatically when the order was delivered and can’t be changed. To record money received, create a new entry with Type “Payment received”.'
            : 'Returned-goods entries can’t be changed once recorded. Delete the entry (its refund is removed too) and record it again.',
        )
      }
    } else if (data.type === 'invoice') {
      reject(
        'Invoices are added automatically when an order is delivered. Choose “Payment received” or “Credit note”.',
      )
    }
  }

  const orderId = idOf(data.order ?? originalDoc?.order)
  if (orderId) {
    const order = await req.payload
      .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    const customerId = idOf(data.customer ?? originalDoc?.customer)
    if (order && idOf(order.customer) !== customerId) {
      reject('The order you chose belongs to a different customer.')
    }
  }
  return data
}

export const preventInvoiceDelete: CollectionBeforeDeleteHook = async ({ context, id, req }) => {
  if (context?.systemEntry) return
  const entry = await req.payload
    .findByID({ collection: 'ledger-entries', id, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (entry?.type === 'invoice') {
    reject(
      'Invoice entries can’t be deleted. To cancel what is owed, cancel the order (a credit note is added) or add a Credit note.',
    )
  }
}

// Whenever a payment or credit note is added, changed or removed, the order it belongs to is
// re-checked: Paid once nothing is owed, back to Delivered if money is owed again
export const settleOrder: CollectionAfterChangeHook<LedgerEntry> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context?.manualSettlement) return doc

  const orderIds = new Set([idOf(doc.order), idOf(previousDoc?.order)].filter(Boolean) as number[])
  let paidInFull = false
  for (const orderId of orderIds) {
    const status = await syncPaidStatus(req.payload, orderId, req)
    if (orderId === idOf(doc.order) && status === 'paid') paidInFull = true
  }

  // A receipt for each new payment (the paid-in-full email covers the last one)
  if (operation === 'create' && doc.type === 'payment' && !paidInFull) {
    const customerId = idOf(doc.customer)!
    const customer = await req.payload.findByID({
      collection: 'customers',
      id: customerId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const balance = await customerBalance(req.payload, customerId, req)
    await notifyPaymentReceived(req.payload, customer, doc.amount, doc.reference || '', balance)
  }
  return doc
}

export const settleOrderAfterDelete: CollectionAfterDeleteHook<LedgerEntry> = async ({
  doc,
  req,
}) => {
  const orderId = idOf(doc.order)
  if (orderId) await syncPaidStatus(req.payload, orderId, req).catch(() => null)
  return doc
}

const round = (value: number) => Math.round(value * 100) / 100

// Credit note for returned bags: priced at the invoiced unit price, never more bags than were
// delivered on that order, and only on delivered or paid orders
export const priceReturnedGoods: CollectionBeforeChangeHook<LedgerEntry> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || data.type !== 'return') return data

  const orderId = idOf(data.order)
  if (!orderId) reject('Choose the order the goods were returned from.')
  const order = await req.payload
    .findByID({ collection: 'orders', id: orderId!, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (!order) reject('That order was not found.')
  if (order!.status !== 'delivered' && order!.status !== 'paid') {
    reject('Goods can only be returned on a delivered or paid order.')
  }

  const productId = idOf(data.product)
  const bags = Math.floor(Number(data.bags))
  if (!productId) reject('Choose the product that was returned.')
  if (!Number.isFinite(bags) || bags < 1) reject('Enter how many bags were returned.')

  const line = order!.items.find((item) => idOf(item.product) === productId)
  if (!line || typeof line.unitPrice !== 'number') reject('That product is not on this order.')

  const { docs: earlier } = await req.payload.find({
    collection: 'ledger-entries',
    where: {
      and: [
        { order: { equals: orderId } },
        { type: { equals: 'return' } },
        { product: { equals: productId } },
      ],
    },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const alreadyReturned = earlier.reduce((sum, entry) => sum + (entry.bags || 0), 0)
  const returnable = line!.quantity - alreadyReturned
  if (bags > returnable) {
    reject(
      returnable > 0
        ? `Only ${returnable} more bag(s) of this product can be returned on this order (${line!.quantity} delivered, ${alreadyReturned} already returned).`
        : `All ${line!.quantity} bag(s) of this product on this order have already been returned.`,
    )
  }

  const amount = round(bags * line!.unitPrice!)
  if (data.settlement === 'refund') {
    // Only money already paid on the order can be refunded
    const balanceAfter = (await orderBalance(req.payload, orderId!, req)) - amount
    if (balanceAfter >= 0) {
      reject(
        'Nothing has been paid on this order that needs refunding; the returned goods simply reduce what they owe. Choose “Keep as credit on account”.',
      )
    }
  }

  const product = await req.payload
    .findByID({ collection: 'products', id: productId!, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  const what = `${bags} bag${bags === 1 ? '' : 's'} ${product?.title ?? 'returned goods'} returned`

  data.customer = idOf(order!.customer)!
  data.bags = bags
  data.amount = amount
  data.reference = data.reference?.trim() || `CN-${order!.invoiceNumber}`
  data.note = data.note?.trim() ? `${what}. ${data.note.trim()}` : what
  return data
}

// "Refund the customer": pay back the part of the returned value that was already paid
export const refundReturnedGoods: CollectionAfterChangeHook<LedgerEntry> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || doc.type !== 'return') return doc

  const orderId = idOf(doc.order)!
  let refunded = 0
  if (doc.settlement === 'refund') {
    const overpaid = -(await orderBalance(req.payload, orderId, req))
    refunded = round(Math.min(doc.amount, Math.max(overpaid, 0)))
    if (refunded > 0) {
      await req.payload.create({
        collection: 'ledger-entries',
        data: {
          customer: idOf(doc.customer)!,
          order: orderId,
          type: 'refund',
          amount: refunded,
          date: doc.date,
          reference: (doc.reference || '').replace(/^CN-/, 'RF-'),
          note: `Refund for ${doc.note}`,
          returnOf: doc.id,
        },
        overrideAccess: true,
        req,
      })
    }
  }

  const customer = await req.payload.findByID({
    collection: 'customers',
    id: idOf(doc.customer)!,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const balance = await customerBalance(req.payload, customer.id, req)
  await notifyGoodsReturned(req.payload, customer, order, doc, refunded, balance)
  return doc
}

// Deleting a returned-goods entry also removes the refund recorded with it. Runs before the
// delete: the database clears the refund's link to the return as soon as the return is gone.
export const removeRefundWithReturn: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'ledger-entries',
    where: { and: [{ returnOf: { equals: id } }, { type: { equals: 'refund' } }] },
    overrideAccess: true,
    req,
  })
}
