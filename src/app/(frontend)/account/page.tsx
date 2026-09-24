import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import { ChevronRightIcon, FileTextIcon } from 'lucide-react'

import { customerBalance } from '@/collections/LedgerEntries/balance'
import { LogoutButton } from '@/components/Account/AuthForms'
import { OrderStatus } from '@/components/Account/OrderStatus'
import { Button } from '@/components/ui/button'
import { formatDate, formatNaira } from '@/utilities/format'
import { getCustomer } from '@/utilities/getCustomer'

export default async function AccountPage() {
  const customer = await getCustomer()
  if (!customer) redirect('/account/login?next=/account')

  const payload = await getPayload({ config: configPromise })
  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    user: customer,
  })

  const needsPO = orders.docs.filter((order) => order.status === 'priced').length
  const balance = await customerBalance(payload, customer.id)

  return (
    <div className="container pt-8 pb-24">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
            My account
          </p>
          <h1 className="text-3xl font-bold">{customer.company}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.name} · {customer.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/products">New quote request</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Outstanding balance</p>
          <p className="mt-1 font-heading text-2xl font-bold text-heading">
            {formatNaira(balance)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Payment terms</p>
          <p className="mt-1 font-heading text-2xl font-bold text-heading">
            {customer.creditDays ?? 15} days
          </p>
        </div>
      </div>

      {needsPO > 0 && (
        <p className="mb-6 rounded-xl bg-brand-purple px-5 py-4 text-white">
          {needsPO === 1 ? 'One order has' : `${needsPO} orders have`} been priced. Open it and
          enter your PO number to receive the invoice.
        </p>
      )}

      <h2 className="mb-4 text-xl font-bold">Orders</h2>
      {orders.docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <FileTextIcon className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p>No orders yet. Add products to a quote to get started.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {orders.docs.map((order) => (
            <li key={order.id}>
              <Link
                className="flex flex-col gap-2 p-5 transition-colors hover:bg-card md:flex-row md:items-center md:justify-between"
                href={`/account/orders/${order.id}`}
              >
                <div>
                  <p className="font-heading font-bold text-heading">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)} · {order.items?.length || 0} product
                    {order.items?.length === 1 ? '' : 's'}
                    {order.invoiceNumber && ` · ${order.invoiceNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {order.invoiceNumber && (
                    <span className="font-heading font-semibold">{formatNaira(order.total)}</span>
                  )}
                  <OrderStatus status={order.status} />
                  <ChevronRightIcon className="hidden h-5 w-5 text-muted-foreground md:block" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false },
}
