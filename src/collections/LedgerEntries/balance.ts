import type { Payload, PayloadRequest, Where } from 'payload'

import type { LedgerEntry } from '@/payload-types'

// Invoices add to what is owed; payments and credit notes reduce it
export const signedAmount = (entry: Pick<LedgerEntry, 'type' | 'amount'>) =>
  entry.type === 'invoice' ? entry.amount : -entry.amount

const sumEntries = async (
  payload: Payload,
  where: Where,
  req?: PayloadRequest,
) => {
  const { docs } = await payload.find({
    collection: 'ledger-entries',
    where,
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return Math.round(docs.reduce((total, entry) => total + signedAmount(entry), 0) * 100) / 100
}

export const customerBalance = (payload: Payload, customerId: number, req?: PayloadRequest) =>
  sumEntries(payload, { customer: { equals: customerId } }, req)

export const orderBalance = (payload: Payload, orderId: number, req?: PayloadRequest) =>
  sumEntries(payload, { order: { equals: orderId } }, req)
