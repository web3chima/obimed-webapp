import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import { ChevronLeftIcon, FileTextIcon } from 'lucide-react'

import { orderAccount } from '@/collections/LedgerEntries/balance'
import { OrderStatus } from '@/components/Account/OrderStatus'
import { OrderTimeline } from '@/components/Account/OrderTimeline'
import { POForm } from '@/components/Account/POForm'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime, formatNaira } from '@/utilities/format'
import { getCustomer } from '@/utilities/getCustomer'
import { getCustomerOrder } from '@/utilities/getCustomerOrder'

type Args = { params: Promise<{ id: string }> }

export default async function OrderPage({ params }: Args) {
  const { id } = await params
  const customer = await getCustomer()
  if (!customer) redirect(`/account/login?next=/account/orders/${id}`)

  const order = await getCustomerOrder(customer, id)
  if (!order) notFound()

  const showPrices = Boolean(order.poNumber)
  const payload = await getPayload({ config: configPromise })
  const account = order.invoiceNumber ? await orderAccount(payload, order.id) : null
  const owedNow = order.status === 'delivered' || order.status === 'paid'

  return (
    <div className="container pt-8 pb-24">
      <Link
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        href="/account"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        My account
      </Link>

      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Requested {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatus status={order.status} />
      </div>

      <div className="mb-8">
        <OrderTimeline status={order.status} />
      </div>

      {order.status === 'submitted' && (
        <p className="mb-8 rounded-xl border border-border bg-card px-5 py-4">
          We have received your request and are preparing prices. We will contact you when it is
          ready for your PO number.
        </p>
      )}

      {order.status === 'priced' && !order.poNumber && (
        <div className="mb-8">
          <POForm orderId={order.id} />
        </div>
      )}

      {order.invoiceNumber && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading font-bold text-heading">Invoice {order.invoiceNumber}</p>
            <p className="text-sm">
              PO {order.poNumber} · Issued {formatDate(order.invoiceDate)}
            </p>
            <p className="text-sm">
              {order.dueDate ? (
                <>
                  Delivered {formatDateTime(order.deliveredAt)} · Payment due{' '}
                  <strong>{formatDateTime(order.dueDate)}</strong>
                </>
              ) : order.status === 'invoiced' ? (
                <>
                  Delivery by <strong>{formatDateTime(order.invoiceValidUntil)}</strong> · Payment
                  due {customer.creditDays ?? 15} days after delivery
                </>
              ) : null}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/account/orders/${order.id}/invoice`}>
              <FileTextIcon />
              View & print invoice
            </Link>
          </Button>
        </div>
      )}

      {account && account.received.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 font-heading font-bold text-heading">Payments</h2>
          <ul className="divide-y divide-border text-sm">
            {account.received.map((entry) => (
              <li className="flex justify-between gap-4 py-2" key={entry.id}>
                <span>
                  {formatDate(entry.date)} ·{' '}
                  {entry.type === 'payment' ? 'Payment received' : 'Credit note'}
                  {entry.reference && ` (${entry.reference})`}
                </span>
                <span className="font-semibold">{formatNaira(entry.amount)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
            <dt>Invoice total</dt>
            <dd className="text-right">{formatNaira(order.total)}</dd>
            <dt>Paid</dt>
            <dd className="text-right">{formatNaira(account.paid)}</dd>
            <dt className="font-heading font-bold">
              {owedNow ? 'Balance due' : 'Balance due on delivery'}
            </dt>
            <dd className="text-right font-heading font-bold">
              {formatNaira(Math.max((order.total ?? 0) - account.paid, 0))}
            </dd>
          </dl>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left">
            <tr>
              <th className="px-4 py-3 font-heading font-semibold">Product</th>
              <th className="px-4 py-3 font-heading font-semibold text-right">Quantity (bags)</th>
              {showPrices && (
                <>
                  <th className="px-4 py-3 font-heading font-semibold text-right">Unit price</th>
                  <th className="px-4 py-3 font-heading font-semibold text-right">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  {typeof item.product === 'object' ? item.product.title : 'Product'}
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                {showPrices && (
                  <>
                    <td className="px-4 py-3 text-right">{formatNaira(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{formatNaira(item.lineTotal)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {showPrices && (
            <tfoot>
              <tr className="bg-card">
                <td className="px-4 py-3 font-heading font-bold" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-heading font-bold">
                  {formatNaira(order.total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {(order.deliveryLocation || order.notes) && (
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          {order.deliveryLocation && (
            <div>
              <dt className="font-heading font-semibold">Delivery location</dt>
              <dd>{order.deliveryLocation}</dd>
            </div>
          )}
          {order.notes && (
            <div>
              <dt className="font-heading font-semibold">Your notes</dt>
              <dd className="whitespace-pre-line">{order.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Order',
  robots: { index: false },
}
