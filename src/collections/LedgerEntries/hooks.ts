import type { CollectionAfterChangeHook } from 'payload'

import type { LedgerEntry } from '@/payload-types'

import { notifyPaymentReceived } from '@/notifications'
import { markPaidWhenSettled } from '@/collections/Orders/hooks'

import { customerBalance } from './balance'

// After a payment or credit note: a delivered order that is now fully settled becomes Paid
// (which emails the customer); otherwise send a payment receipt with the remaining balance
export const settleOrder: CollectionAfterChangeHook<LedgerEntry> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || doc.type === 'invoice') return doc

  const orderId = typeof doc.order === 'object' ? doc.order?.id : doc.order
  if (orderId) {
    await markPaidWhenSettled(req.payload, orderId, req)
    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    // The paid-in-full email covers this payment
    if (order.status === 'paid') return doc
  }

  if (doc.type === 'payment') {
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
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
