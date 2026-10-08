import type { CollectionConfig } from 'payload'

import { salesStaff, salesOrOwnCustomer } from '../../access/roles'
import {
  fillCustomerFromOrder,
  lockedOnInvoices,
  priceReturnedGoods,
  refundReturnedGoods,
  removeRefundWithReturn,
  preventInvoiceDelete,
  protectLedgerEntries,
  settleOrder,
  settleOrderAfterDelete,
} from './hooks'

// Customer account ledger. Invoices are added automatically when an order is delivered and
// are locked; staff record payments and credit notes here. Balance = invoices − payments −
// credit notes, and an order becomes Paid as soon as its balance reaches zero.
export const LedgerEntries: CollectionConfig<'ledger-entries'> = {
  slug: 'ledger-entries',
  labels: { singular: 'Ledger entry', plural: 'Ledger' },
  access: {
    create: salesStaff,
    read: salesOrOwnCustomer('customer'),
    update: salesStaff,
    delete: salesStaff,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['date', 'customer', 'order', 'type', 'amount', 'reference'],
    useAsTitle: 'reference',
    description:
      'Invoices appear here automatically when an order is delivered and can’t be edited. When a customer pays, click Create New, choose Payment received, pick the order and enter the amount received (part payments are fine); the order becomes Paid as soon as nothing is owed on it. If bags come back, choose Credit note (goods returned), pick the order, product and number of bags: the value is worked out from the invoice price.',
  },
  defaultSort: '-date',
  hooks: {
    beforeValidate: [fillCustomerFromOrder],
    beforeChange: [priceReturnedGoods, protectLedgerEntries],
    afterChange: [settleOrder, refundReturnedGoods],
    beforeDelete: [preventInvoiceDelete, removeRefundWithReturn],
    afterDelete: [settleOrderAfterDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'customer',
          type: 'relationship',
          relationTo: 'customers',
          access: { update: lockedOnInvoices },
          admin: { description: 'Filled in from the order if you leave it empty.' },
        },
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
          access: { update: lockedOnInvoices },
          admin: { description: 'The order this payment is for, so its balance goes down.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'payment',
          access: { update: lockedOnInvoices },
          // "Invoice" is only shown on entries the system created
          filterOptions: ({ data, options }) =>
            data?.type === 'invoice'
              ? options
              : options.filter((option) =>
                  typeof option === 'string' ? option !== 'invoice' : option.value !== 'invoice',
                ),
          options: [
            { label: 'Invoice (amount owed)', value: 'invoice' },
            { label: 'Payment received', value: 'payment' },
            { label: 'Credit note', value: 'credit-note' },
            { label: 'Credit note (goods returned)', value: 'return' },
            { label: 'Refund paid to customer', value: 'refund' },
          ],
        },
        {
          name: 'amount',
          label: 'Amount (₦)',
          type: 'number',
          required: true,
          min: 0,
          access: { update: lockedOnInvoices },
          // Returned goods are priced automatically from the invoice (filled in before saving)
          validate: (value: number | null | undefined, { siblingData }: { siblingData: Partial<{ type: string }> }) =>
            siblingData?.type === 'return' || typeof value === 'number' ? true : 'Enter the amount.',
          admin: {
            description: 'For goods returned, leave empty: it is worked out from the invoice price.',
          },
        },
        {
          name: 'date',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          access: { update: lockedOnInvoices },
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      type: 'row',
      admin: { condition: (data) => data?.type === 'return' },
      fields: [
        {
          name: 'product',
          label: 'Product returned',
          type: 'relationship',
          relationTo: 'products',
          access: { update: lockedOnInvoices },
        },
        {
          name: 'bags',
          label: 'Bags returned',
          type: 'number',
          min: 1,
          access: { update: lockedOnInvoices },
        },
        {
          name: 'settlement',
          label: 'If already paid',
          type: 'select',
          defaultValue: 'credit',
          access: { update: lockedOnInvoices },
          options: [
            { label: 'Keep as credit on account', value: 'credit' },
            { label: 'Refund the customer', value: 'refund' },
          ],
          admin: {
            description:
              'Refund only applies to money already paid on this order; anything else reduces what they owe.',
          },
        },
      ],
    },
    {
      name: 'returnOf',
      label: 'Refund for',
      type: 'relationship',
      relationTo: 'ledger-entries',
      admin: { readOnly: true, condition: (data) => Boolean(data?.returnOf) },
    },
    {
      name: 'reference',
      type: 'text',
      admin: { description: 'Invoice number, bank reference, etc.' },
    },
    { name: 'note', type: 'textarea' },
  ],
  timestamps: true,
}
