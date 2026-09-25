import type { CollectionAfterChangeHook } from 'payload'

import type { LedgerEntry } from '@/payload-types'

import { notifyPaymentReceived } from '@/notifications'
import { customerBalance, orderBalance } from './balance'

// After a payment or credit note: mark a fully settled order as paid (which emails the
// customer), otherwise send a payment receipt with the remaining balance
export const settleOrder: CollectionAfterChangeHook<LedgerEntry> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || doc.type === 'invoice') return doc

  const orderId = typeof doc.order === 'object' ? doc.order?.id : doc.order
  if (orderId) {
    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const settled = (await orderBalance(req.payload, orderId, req)) <= 0
    if (settled && ['invoiced', 'delivered'].includes(order.status)) {
      await req.payload.update({
        collection: 'orders',
        id: orderId,
        data: { status: 'paid' },
        overrideAccess: true,
        context: { settledByLedger: true },
        req,
      })
      return doc
    }
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
