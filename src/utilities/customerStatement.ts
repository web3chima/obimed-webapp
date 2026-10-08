import type { Payload } from 'payload'

import type { Customer, LedgerEntry, Order } from '@/payload-types'

import { signedAmount } from '@/collections/LedgerEntries/balance'

export type StatementRow = {
  id: number
  date: string
  type: LedgerEntry['type']
  description: string
  reference: string
  orderNumber: string
  poNumber: string
  debit: number
  credit: number
  balance: number
}

export type StatementOrder = Pick<
  Order,
  | 'id'
  | 'orderNumber'
  | 'poNumber'
  | 'invoiceNumber'
  | 'invoiceDate'
  | 'deliveredAt'
  | 'dueDate'
  | 'total'
  | 'status'
  | 'createdAt'
>

const typeLabels: Record<LedgerEntry['type'], string> = {
  invoice: 'Invoice',
  payment: 'Payment received',
  'credit-note': 'Credit note',
}

// "2026-10-01" → start of that day in Lagos (UTC+1), so ranges match the dates customers see
const lagosDayStart = (day: string) => new Date(`${day}T00:00:00+01:00`)
const isDay = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

const round = (value: number) => Math.round(value * 100) / 100

// The customer's account history: every invoice, payment and credit note with a running balance,
// plus their orders and PO numbers. Read with the customer's own access, so it only ever
// contains their records.
export const buildStatement = async (
  payload: Payload,
  customer: Customer,
  range: { from?: string; to?: string } = {},
) => {
  const from = isDay(range.from) ? range.from! : undefined
  const to = isDay(range.to) ? range.to! : undefined
  const asCustomer = { ...customer, collection: 'customers' as const }

  const [entries, orders] = await Promise.all([
    payload.find({
      collection: 'ledger-entries',
      depth: 0,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      sort: ['date', 'createdAt'],
      user: asCustomer,
    }),
    payload.find({
      collection: 'orders',
      depth: 0,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      sort: '-createdAt',
      user: asCustomer,
      select: {
        orderNumber: true,
        poNumber: true,
        invoiceNumber: true,
        invoiceDate: true,
        deliveredAt: true,
        dueDate: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
  ])

  const ordersById = new Map(orders.docs.map((order) => [order.id, order]))
  const start = from ? lagosDayStart(from) : null
  // "to" includes the whole of that day
  const end = to ? new Date(lagosDayStart(to).getTime() + 86_400_000) : null

  let opening = 0
  let balance = 0
  const rows: StatementRow[] = []

  for (const entry of entries.docs) {
    const when = new Date(entry.date)
    if (end && when >= end) continue
    const amount = signedAmount(entry)
    balance = round(balance + amount)
    if (start && when < start) {
      opening = balance
      continue
    }
    const orderId = typeof entry.order === 'object' ? entry.order?.id : entry.order
    const order = orderId ? ordersById.get(orderId) : undefined
    rows.push({
      id: entry.id,
      date: entry.date,
      type: entry.type,
      description: entry.note ? `${typeLabels[entry.type]}: ${entry.note}` : typeLabels[entry.type],
      reference: entry.reference || '',
      orderNumber: order?.orderNumber || '',
      poNumber: order?.poNumber || '',
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? -amount : 0,
      balance,
    })
  }

  const totals = rows.reduce(
    (sum, row) => ({ debit: round(sum.debit + row.debit), credit: round(sum.credit + row.credit) }),
    { debit: 0, credit: 0 },
  )

  // Orders with a PO number (purchase orders) in the period, newest first
  const purchaseOrders = orders.docs.filter((order) => {
    if (!order.poNumber) return false
    const when = new Date(order.invoiceDate || order.createdAt)
    return (!start || when >= start) && (!end || when < end)
  }) as StatementOrder[]

  return {
    from,
    to,
    opening,
    closing: balance,
    rows,
    totals,
    purchaseOrders,
    generatedAt: new Date().toISOString(),
  }
}

export type Statement = Awaited<ReturnType<typeof buildStatement>>
