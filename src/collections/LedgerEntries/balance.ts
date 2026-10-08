import type { Payload, PayloadRequest, Where } from 'payload'

import type { LedgerEntry } from '@/payload-types'

// Invoices (and refunds paid back to the customer) add to what is owed; payments, credit notes
// and returned goods reduce it
export const signedAmount = (entry: Pick<LedgerEntry, 'type' | 'amount'>) =>
  entry.type === 'invoice' || entry.type === 'refund' ? entry.amount : -entry.amount

export const ledgerTypeLabels: Record<LedgerEntry['type'], string> = {
  invoice: 'Invoice',
  payment: 'Payment received',
  'credit-note': 'Credit note',
  return: 'Credit note (goods returned)',
  refund: 'Refund paid',
}

const sumEntries = async (payload: Payload, where: Where, req?: PayloadRequest) => {
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

// What has been paid or credited on an order (net of refunds), and what is still owed on it
export const orderAccount = async (payload: Payload, orderId: number, req?: PayloadRequest) => {
  const { docs } = await payload.find({
    collection: 'ledger-entries',
    where: { order: { equals: orderId } },
    limit: 0,
    pagination: false,
    depth: 0,
    sort: 'date',
    overrideAccess: true,
    req,
  })
  const received = docs.filter((entry) => entry.type !== 'invoice')
  const paid = Math.round(-received.reduce((total, entry) => total + signedAmount(entry), 0) * 100) / 100
  const balance = Math.round(docs.reduce((total, entry) => total + signedAmount(entry), 0) * 100) / 100
  return { received, paid, balance }
}
