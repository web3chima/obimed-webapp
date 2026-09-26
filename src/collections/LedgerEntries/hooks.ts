import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  FieldAccess,
} from 'payload'

import { APIError } from 'payload'

import type { LedgerEntry } from '@/payload-types'

import { notifyPaymentReceived } from '@/notifications'
import { syncPaidStatus } from '@/collections/Orders/hooks'

import { customerBalance } from './balance'

const reject = (message: string) => {
  throw new APIError(message, 400, undefined, true)
}

const idOf = (value: unknown) =>
  value && typeof value === 'object' ? (value as { id: number }).id : (value as number | null)

// Invoice entries are written by the order (on delivery); staff can only add notes to them
export const lockedOnInvoices: FieldAccess<LedgerEntry> = ({ doc }) => doc?.type !== 'invoice'

// Invoices are only ever added by the system, and an entry's customer must match its order
export const protectLedgerEntries: CollectionBeforeChangeHook<LedgerEntry> = async ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!context?.systemEntry) {
    if (originalDoc?.type === 'invoice') {
      const changed = (['type', 'amount', 'customer', 'order', 'date'] as const).some(
        (field) =>
          data[field] !== undefined &&
          (field === 'customer' || field === 'order'
            ? idOf(data[field]) !== idOf(originalDoc[field])
            : data[field] !== originalDoc[field]),
      )
      if (changed) {
        reject(
          'This invoice entry was added automatically when the order was delivered and can’t be changed. To record money received, create a new entry with Type “Payment received”.',
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
