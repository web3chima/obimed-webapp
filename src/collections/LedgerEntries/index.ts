import type { CollectionConfig } from 'payload'

import { salesStaff, salesOrOwnCustomer } from '../../access/roles'
import {
  lockedOnInvoices,
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
      'Invoices appear here automatically when an order is delivered and can’t be edited. When a customer pays, click Create New, choose Payment received, pick the order and enter the amount received (part payments are fine). The order becomes Paid as soon as nothing is owed on it.',
  },
  defaultSort: '-date',
  hooks: {
    beforeChange: [protectLedgerEntries],
    afterChange: [settleOrder],
    beforeDelete: [preventInvoiceDelete],
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
          required: true,
          access: { update: lockedOnInvoices },
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
          ],
        },
        {
          name: 'amount',
          label: 'Amount (₦)',
          type: 'number',
          required: true,
          min: 0,
          access: { update: lockedOnInvoices },
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
      name: 'reference',
      type: 'text',
      admin: { description: 'Invoice number, bank reference, etc.' },
    },
    { name: 'note', type: 'textarea' },
  ],
  timestamps: true,
}
