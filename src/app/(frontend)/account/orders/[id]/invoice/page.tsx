import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import { ChevronLeftIcon } from 'lucide-react'

import { orderAccount } from '@/collections/LedgerEntries/balance'
import { PrintButton } from '@/components/Account/PrintButton'
import { Logo } from '@/components/Logo/Logo'
import { formatDate, formatDateTime, formatNaira } from '@/utilities/format'
import { getCustomer } from '@/utilities/getCustomer'
import { getCustomerOrder } from '@/utilities/getCustomerOrder'
import { formatPhone, siteConfig } from '@/utilities/siteConfig'

type Args = { params: Promise<{ id: string }> }

export default async function InvoicePage({ params }: Args) {
  const { id } = await params
  const customer = await getCustomer()
  if (!customer) redirect(`/account/login?next=/account/orders/${id}/invoice`)

  const order = await getCustomerOrder(customer, id)
  if (!order?.invoiceNumber) notFound()

  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({
    slug: 'invoice-settings',
    overrideAccess: false,
    user: customer,
  })
  const { paid } = await orderAccount(payload, order.id)
  const balanceDue = Math.max((order.total ?? 0) - paid, 0)

  return (
    <div className="container max-w-4xl pt-8 pb-24 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          href={`/account/orders/${order.id}`}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-border bg-white p-8 text-[#4b4b4d] md:p-12 print:rounded-none print:border-0 print:p-0">
        {order.status === 'paid' && (
          <p className="mb-6 rounded-lg border-2 border-brand-green px-4 py-3 text-center font-heading font-bold uppercase tracking-wider text-[#5f7d25]">
            Paid in full
          </p>
        )}
        {(order.status === 'expired' || order.status === 'cancelled') && (
          <p className="mb-6 rounded-lg border-2 border-destructive px-4 py-3 text-center font-heading font-bold uppercase tracking-wider text-destructive">
            {order.status === 'expired' ? 'Expired: not payable' : 'Cancelled: not payable'}
          </p>
        )}
        <header className="flex flex-col gap-6 border-b-4 border-brand-green pb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="h-12" variant="color" />
            <p className="mt-4 text-sm leading-relaxed">
              {siteConfig.address}
              <br />
              {siteConfig.phones.slice(0, 2).map(formatPhone).join(', ')}
              <br />
              {siteConfig.email}
              <br />
              RC: {siteConfig.rcNumber}
            </p>
          </div>
          <div className="md:text-right">
            <h1 className="font-heading text-3xl font-bold text-[#2f2566]">INVOICE</h1>
            <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm md:justify-end">
              <dt className="font-semibold">Invoice no.</dt>
              <dd>{order.invoiceNumber}</dd>
              <dt className="font-semibold">Invoice date</dt>
              <dd>{formatDate(order.invoiceDate)}</dd>
              <dt className="font-semibold">Delivery by</dt>
              <dd>{formatDateTime(order.invoiceValidUntil)}</dd>
              {order.deliveredAt && (
                <>
                  <dt className="font-semibold">Delivered</dt>
                  <dd>{formatDateTime(order.deliveredAt)}</dd>
                </>
              )}
              <dt className="font-semibold">Payment due</dt>
              <dd className="font-bold text-[#2f2566]">
                {order.dueDate
                  ? formatDateTime(order.dueDate)
                  : `${customer.creditDays ?? 15} days after delivery`}
              </dd>
              <dt className="font-semibold">PO / LPO no.</dt>
              <dd>{order.poNumber}</dd>
              <dt className="font-semibold">Order no.</dt>
              <dd>{order.orderNumber}</dd>
            </dl>
          </div>
        </header>

        <section className="py-8">
          <h2 className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#5f7d25]">
            Bill to
          </h2>
          <p className="font-heading font-bold text-[#2f2566]">{customer.company}</p>
          <p className="text-sm leading-relaxed">
            {customer.name}
            <br />
            {customer.phone} · {customer.email}
            {(order.deliveryLocation || customer.address) && (
              <>
                <br />
                {order.deliveryLocation || customer.address}
              </>
            )}
          </p>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#483998] text-left text-white print:bg-[#483998]">
              <th className="px-4 py-3 font-heading font-semibold">Description</th>
              <th className="px-4 py-3 text-right font-heading font-semibold">Qty (bags)</th>
              <th className="px-4 py-3 text-right font-heading font-semibold">Unit price</th>
              <th className="px-4 py-3 text-right font-heading font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr className={i % 2 ? 'bg-[#f7f6fb]' : undefined} key={item.id}>
                <td className="px-4 py-3">
                  {typeof item.product === 'object' ? item.product.title : 'Product'}
                  {typeof item.product === 'object' && item.product.packaging && (
                    <span className="block text-xs text-[#66666b]">{item.product.packaging}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatNaira(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{formatNaira(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#483998]">
              <td className="px-4 py-4 font-heading text-base font-bold text-[#2f2566]" colSpan={3}>
                Invoice total
              </td>
              <td className="px-4 py-4 text-right font-heading text-base font-bold text-[#2f2566]">
                {formatNaira(order.total)}
              </td>
            </tr>
            {paid > 0 && (
              <>
                <tr>
                  <td className="px-4 py-2" colSpan={3}>
                    Paid
                  </td>
                  <td className="px-4 py-2 text-right">− {formatNaira(paid)}</td>
                </tr>
                <tr className="border-t border-[#e4e1ef]">
                  <td
                    className="px-4 py-3 font-heading text-base font-bold text-[#2f2566]"
                    colSpan={3}
                  >
                    Balance due
                  </td>
                  <td className="px-4 py-3 text-right font-heading text-base font-bold text-[#2f2566]">
                    {formatNaira(balanceDue)}
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        <footer className="mt-10 grid gap-6 border-t border-[#e4e1ef] pt-6 text-sm md:grid-cols-2">
          <div>
            <h2 className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#5f7d25]">
              Payment details
            </h2>
            {settings.bankName || settings.accountNumber ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="font-semibold">Bank</dt>
                <dd>{settings.bankName}</dd>
                <dt className="font-semibold">Account name</dt>
                <dd>{settings.accountName}</dd>
                <dt className="font-semibold">Account no.</dt>
                <dd>{settings.accountNumber}</dd>
                <dt className="font-semibold">Reference</dt>
                <dd>{order.invoiceNumber}</dd>
              </dl>
            ) : (
              <p>Please contact Obimed for payment details.</p>
            )}
          </div>
          {settings.notes && <p className="leading-relaxed md:text-right">{settings.notes}</p>}
        </footer>
      </article>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Invoice',
  robots: { index: false },
}
