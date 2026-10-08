'use client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderLeft: '6px solid #483998',
  borderRadius: 8,
  padding: '14px 18px',
  marginBottom: 24,
  background: 'var(--theme-elevation-50)',
  lineHeight: 1.5,
}

// Tells staff what to do next with this order, based on its current state
export const NextStep: React.FC = () => {
  const { id } = useDocumentInfo()
  const fields = useFormFields(([all]) => all)

  const status = fields.status?.value as string | undefined
  const rows = Number(fields.items?.value ?? 0)
  const unpriced = Array.from({ length: rows }).filter(
    (_, i) => typeof fields[`items.${i}.unitPrice`]?.value !== 'number',
  ).length
  const invoiceNumber = fields.invoiceNumber?.value as string | undefined
  const terms = fields.paymentTerms?.value as string | undefined
  const total = Number(fields.total?.value ?? 0)

  // Pay-before-delivery orders: how much has come in, so staff can check before delivering
  const [paid, setPaid] = useState<number | null>(null)
  useEffect(() => {
    if (!id || status !== 'invoiced' || terms !== 'prepaid') return
    fetch(`/api/ledger-entries?where[order][equals]=${id}&limit=200&depth=0`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { docs?: { type: string; amount: number }[] }) =>
        setPaid(
          (data.docs || [])
            .filter((entry) => entry.type !== 'invoice')
            .reduce((sum, entry) => sum + entry.amount, 0),
        ),
      )
      .catch(() => setPaid(null))
  }, [id, status, terms])
  const naira = (value: number) =>
    `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const validUntil = fields.invoiceValidUntil?.value as string | undefined
  const validText = validUntil
    ? new Date(validUntil).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Lagos',
      })
    : 'its 7-day validity'

  let title: string
  let text: string
  if (!id) {
    title = 'New order for a customer'
    text =
      'Choose an approved customer, add each product with its quantity in bags, then Save. You can add unit prices now or after saving; once every item has a price the customer is asked for their PO number.'
  } else if (status === 'submitted') {
    title = 'Next: add prices'
    text = `Enter a Unit price (₦ per bag) for every item${
      unpriced ? ` (${unpriced} of ${rows} still need a price)` : ''
    }, then click Save. The order becomes “Priced” and the customer is asked for their PO number. If a product is short, set Status to Cancelled and Save so the customer can resubmit (only a super admin can change quantities).`
  } else if (status === 'priced') {
    title = 'Waiting for the customer’s PO number'
    text =
      'The customer has been asked to enter their PO number on their account, which issues the invoice. If they sent the PO to you directly, type it in “PO / LPO number” (right) and Save.'
  } else if (status === 'invoiced' && terms === 'prepaid') {
    const unpaid = paid !== null && paid < total
    title = `Invoiced${invoiceNumber ? ` (${invoiceNumber})` : ''}: pay before delivery, by ${validText}`
    text = `${
      paid === null
        ? 'Checking payments…'
        : unpaid
          ? `⚠ Not fully paid: ${naira(paid)} of ${naira(total)} received. This customer pays before delivery; record payments in “Payments & credit notes” below before you deliver.`
          : `Paid in full (${naira(paid)}). Deliver now: when you set Status to Delivered it becomes Paid automatically.`
    } When the goods are delivered, set Status to Delivered and Save. If it is neither delivered nor paid within 7 days it expires automatically.`
  } else if (status === 'invoiced') {
    title = `Invoiced${invoiceNumber ? ` (${invoiceNumber})` : ''}: deliver by ${validText}`
    text =
      'You have 7 days to deliver. When the goods are delivered, set Status to Delivered and Save: the invoice is then recorded as owed and payment is due under the customer’s terms (on delivery, or after their credit days). If it is neither delivered nor paid in 7 days it expires automatically. Payments received before delivery stop it expiring.'
  } else if (status === 'delivered') {
    title = 'Delivered: awaiting payment'
    text =
      'Payment is due by the date in “Payment due” (right). When money arrives, scroll to “Payments & credit notes” below, click Add new, choose Type “Payment received” and enter the amount. Part payments reduce the balance; the order becomes Paid as soon as nothing is owed. Don’t edit the order’s Invoice entry in the ledger. A super admin can also set Status to Paid here, which records the outstanding amount as a payment. If bags come back, add a “Credit note (goods returned)” there too.'
  } else if (status === 'expired') {
    title = 'Invoice expired'
    text =
      'The goods were not delivered within 7 days and nothing had been paid, so the invoice expired. It was never owed, so the ledger is unchanged. The customer can submit a new request.'
  } else if (status === 'paid') {
    title = 'Complete'
    text =
      'This order is paid in full. If bags come back, add a “Credit note (goods returned)” in “Payments & credit notes” below: choose keep as credit or refund. If a payment is corrected so money is owed again, it goes back to Delivered by itself.'
  } else {
    title = 'Cancelled'
    text = 'This order was cancelled.'
  }

  const warn = status === 'invoiced' && terms === 'prepaid' && paid !== null && paid < total
  return (
    <div style={warn ? { ...box, borderLeftColor: '#d97706' } : box}>
      <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
      <span>{text}</span>
    </div>
  )
}
