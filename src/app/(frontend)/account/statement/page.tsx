import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import { ChevronLeftIcon, DownloadIcon } from 'lucide-react'

import { dueInWords, termsLabel } from '@/collections/Orders/terms'
import { orderStatusLabels } from '@/components/Account/OrderStatus'
import { PrintButton } from '@/components/Account/PrintButton'
import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import { buildStatement } from '@/utilities/customerStatement'
import { formatDate, formatDateTime, formatNaira } from '@/utilities/format'
import { getCustomer } from '@/utilities/getCustomer'
import { formatPhone, siteConfig } from '@/utilities/siteConfig'

type Args = { searchParams: Promise<{ from?: string; to?: string }> }

// Positive = owed to Obimed; negative = credit on the customer's account
const balanceText = (value: number) =>
  value < 0 ? `${formatNaira(-value)} credit` : formatNaira(value)

export default async function StatementPage({ searchParams }: Args) {
  const range = await searchParams
  const customer = await getCustomer()
  if (!customer) redirect('/account/login?next=/account/statement')

  const payload = await getPayload({ config: configPromise })
  const statement = await buildStatement(payload, customer, range)
  const query = new URLSearchParams(
    Object.entries({ from: statement.from, to: statement.to }).filter(([, v]) => v) as [
      string,
      string,
    ][],
  ).toString()

  const period =
    statement.from || statement.to
      ? `${statement.from ? formatDate(statement.from) : 'Start of account'} – ${
          statement.to ? formatDate(statement.to) : 'today'
        }`
      : 'All transactions'

  return (
    <div className="container max-w-5xl pt-8 pb-24 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <Link
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          href="/account"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          My account
        </Link>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-end md:justify-between">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="grid gap-1 text-sm font-semibold">
              From
              <input
                className="rounded-md border border-input bg-background px-3 py-2 font-normal"
                defaultValue={statement.from}
                name="from"
                type="date"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              To
              <input
                className="rounded-md border border-input bg-background px-3 py-2 font-normal"
                defaultValue={statement.to}
                name="to"
                type="date"
              />
            </label>
            <Button type="submit" variant="outline">
              Show
            </Button>
            {query && (
              <Link className="pb-2 text-sm text-primary hover:underline" href="/account/statement">
                All dates
              </Link>
            )}
          </form>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="outline">
              <a download href={`/account/statement/csv${query ? `?${query}` : ''}`}>
                <DownloadIcon />
                Download (Excel / CSV)
              </a>
            </Button>
            <PrintButton />
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-border bg-white p-6 text-[#4b4b4d] md:p-10 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-col gap-6 border-b-4 border-brand-green pb-6 md:flex-row md:items-start md:justify-between print:flex-row">
          <div>
            <Logo className="h-12" variant="color" />
            <p className="mt-4 text-sm leading-relaxed">
              {siteConfig.address}
              <br />
              {siteConfig.phones.slice(0, 2).map(formatPhone).join(', ')} · {siteConfig.email}
              <br />
              RC: {siteConfig.rcNumber}
            </p>
          </div>
          <div className="md:text-right print:text-right">
            <h1 className="font-heading text-2xl font-bold text-[#2f2566] md:text-3xl">
              STATEMENT OF ACCOUNT
            </h1>
            <p className="mt-2 text-sm">{period}</p>
            <p className="text-xs text-[#66666b]">
              Generated {formatDateTime(statement.generatedAt)}
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-6 md:grid-cols-2 print:grid-cols-2">
          <div>
            <h2 className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#5f7d25]">
              Customer
            </h2>
            <p className="font-heading font-bold text-[#2f2566]">{customer.company}</p>
            <p className="text-sm leading-relaxed">
              {customer.name}
              <br />
              {customer.phone} · {customer.email}
              {customer.address && (
                <>
                  <br />
                  {customer.address}
                </>
              )}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Payment terms:</span> {termsLabel(customer)} (due{' '}
              {dueInWords(customer)})
            </p>
          </div>
          <dl className="grid grid-cols-[1fr_auto] content-start gap-x-6 gap-y-1 rounded-xl bg-[#f7f6fb] p-4 text-sm">
            <dt>Opening balance</dt>
            <dd className="text-right">{balanceText(statement.opening)}</dd>
            <dt>Invoiced</dt>
            <dd className="text-right">{formatNaira(statement.totals.debit)}</dd>
            <dt>Paid &amp; credited</dt>
            <dd className="text-right">− {formatNaira(statement.totals.credit)}</dd>
            <dt className="border-t border-[#e4e1ef] pt-2 font-heading font-bold text-[#2f2566]">
              {statement.closing < 0 ? 'Credit on account' : 'Balance due'}
            </dt>
            <dd className="border-t border-[#e4e1ef] pt-2 text-right font-heading font-bold text-[#2f2566]">
              {formatNaira(Math.abs(statement.closing))}
            </dd>
          </dl>
        </section>

        <h2 className="mb-3 font-heading text-lg font-bold text-[#2f2566]">Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-[#483998] text-left text-white print:bg-[#483998]">
                <th className="px-3 py-2 font-heading font-semibold">Date</th>
                <th className="px-3 py-2 font-heading font-semibold">Details</th>
                <th className="px-3 py-2 font-heading font-semibold">Reference</th>
                <th className="px-3 py-2 font-heading font-semibold">PO no.</th>
                <th className="px-3 py-2 text-right font-heading font-semibold">Invoiced</th>
                <th className="px-3 py-2 text-right font-heading font-semibold">Paid</th>
                <th className="px-3 py-2 text-right font-heading font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f7f6fb]">
                <td className="px-3 py-2" colSpan={6}>
                  Opening balance
                </td>
                <td className="px-3 py-2 text-right">{balanceText(statement.opening)}</td>
              </tr>
              {statement.rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-[#66666b]" colSpan={7}>
                    No transactions in this period.
                  </td>
                </tr>
              ) : (
                statement.rows.map((row, i) => (
                  <tr className={i % 2 ? 'bg-[#f7f6fb]' : undefined} key={row.id}>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(row.date)}</td>
                    <td className="px-3 py-2">
                      {row.description}
                      {row.orderNumber && (
                        <span className="block text-xs text-[#66666b]">{row.orderNumber}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.reference || '—'}</td>
                    <td className="px-3 py-2">{row.poNumber || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {row.debit ? formatNaira(row.debit) : ''}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.credit ? formatNaira(row.credit) : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                      {balanceText(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#483998] font-heading font-bold text-[#2f2566]">
                <td className="px-3 py-3" colSpan={4}>
                  Closing balance
                </td>
                <td className="px-3 py-3 text-right">{formatNaira(statement.totals.debit)}</td>
                <td className="px-3 py-3 text-right">{formatNaira(statement.totals.credit)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  {balanceText(statement.closing)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h2 className="mb-3 mt-10 font-heading text-lg font-bold text-[#2f2566] print:break-before-auto">
          Purchase orders
        </h2>
        {statement.purchaseOrders.length === 0 ? (
          <p className="text-sm text-[#66666b]">No purchase orders in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b-2 border-[#483998] text-left text-[#2f2566]">
                  <th className="px-3 py-2 font-heading font-semibold">PO no.</th>
                  <th className="px-3 py-2 font-heading font-semibold">Order</th>
                  <th className="px-3 py-2 font-heading font-semibold">Invoice</th>
                  <th className="px-3 py-2 font-heading font-semibold">Invoice date</th>
                  <th className="px-3 py-2 font-heading font-semibold">Delivered</th>
                  <th className="px-3 py-2 font-heading font-semibold">Payment due</th>
                  <th className="px-3 py-2 font-heading font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-heading font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {statement.purchaseOrders.map((order, i) => (
                  <tr className={i % 2 ? 'bg-[#f7f6fb]' : undefined} key={order.id}>
                    <td className="px-3 py-2 font-semibold">{order.poNumber}</td>
                    <td className="px-3 py-2">
                      <Link
                        className="text-primary hover:underline print:text-inherit print:no-underline"
                        href={`/account/orders/${order.id}`}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{order.invoiceNumber || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(order.invoiceDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(order.deliveredAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(order.dueDate)}</td>
                    <td className="px-3 py-2">{orderStatusLabels[order.status]}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {formatNaira(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-10 border-t border-[#e4e1ef] pt-4 text-xs leading-relaxed text-[#66666b]">
          Invoices are recorded when goods are delivered. Payments made before delivery appear as
          credit until the invoice is recorded. Please contact {siteConfig.emails.accounts} if
          anything on this statement looks wrong.
        </p>
      </article>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Statement of account',
  robots: { index: false },
}
