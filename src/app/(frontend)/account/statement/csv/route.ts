import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { buildStatement } from '@/utilities/customerStatement'
import { getCustomer } from '@/utilities/getCustomer'

export const dynamic = 'force-dynamic'

// One CSV cell. Text that a spreadsheet would run as a formula (=, +, -, @) is prefixed with '
const cell = (value: string | number) => {
  if (typeof value === 'number') return value.toFixed(2)
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const lagosDay = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) : ''

// GET /account/statement/csv?from=YYYY-MM-DD&to=YYYY-MM-DD — the signed-in customer's statement
export async function GET(request: Request) {
  const customer = await getCustomer()
  if (!customer) return new Response('Please sign in to your customer account.', { status: 401 })

  const params = new URL(request.url).searchParams
  const payload = await getPayload({ config: configPromise })
  const statement = await buildStatement(payload, customer, {
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
  })

  const lines: (string | number)[][] = [
    ['Statement of account', customer.company],
    ['Period', `${statement.from ?? 'Start of account'} to ${statement.to ?? 'today'}`],
    [],
    ['Date', 'Details', 'Order', 'Reference', 'PO number', 'Invoiced (NGN)', 'Paid (NGN)', 'Balance (NGN)'],
    ...statement.rows.map((row) => [
      lagosDay(row.date),
      row.description,
      row.orderNumber,
      row.reference,
      row.poNumber,
      row.debit || '',
      row.credit || '',
      row.balance,
    ]),
    ['', 'Closing balance', '', '', '', statement.totals.debit, statement.totals.credit, statement.closing],
    [],
    ['Purchase orders'],
    ['PO number', 'Order', 'Invoice', 'Invoice date', 'Delivered', 'Payment due', 'Status', 'Total (NGN)'],
    ...statement.purchaseOrders.map((order) => [
      order.poNumber ?? '',
      order.orderNumber ?? '',
      order.invoiceNumber ?? '',
      lagosDay(order.invoiceDate),
      lagosDay(order.deliveredAt),
      lagosDay(order.dueDate),
      order.status,
      order.total ?? '',
    ]),
  ]

  // BOM so Excel reads ₦ and accents correctly
  const csv = '﻿' + lines.map((line) => line.map(cell).join(',')).join('\r\n')
  const name = `obimed-statement-${lagosDay(statement.generatedAt)}.csv`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
