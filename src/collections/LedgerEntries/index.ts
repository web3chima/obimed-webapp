import type { CollectionConfig } from 'payload'

import { salesStaff, salesOrOwnCustomer } from '../../access/roles'
import { settleOrder } from './hooks'

// Customer account ledger. Invoices are added automatically when a customer submits a PO;
// staff record payments and credit notes here. Balance = invoices − payments − credit notes.
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
    defaultColumns: ['date', 'customer', 'type', 'amount', 'reference'],
    useAsTitle: 'reference',
    description:
      'Invoices appear here automatically. Add a Payment when a customer pays, or a Credit note to reduce what they owe.',
  },
  defaultSort: '-date',
  hooks: {
    afterChange: [settleOrder],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'customer', type: 'relationship', relationTo: 'customers', required: true },
        { name: 'order', type: 'relationship', relationTo: 'orders' },
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
          options: [
            { label: 'Invoice (amount owed)', value: 'invoice' },
            { label: 'Payment received', value: 'payment' },
            { label: 'Credit note', value: 'credit-note' },
          ],
        },
        { name: 'amount', label: 'Amount (₦)', type: 'number', required: true, min: 0 },
        {
          name: 'date',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
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
