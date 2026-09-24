import type { CollectionConfig, FieldAccess } from 'payload'

import { isStaffUser, staffOnly, staffOnlyField, staffOrOwnCustomer } from '../../access/roles'
import {
  assignOrderNumber,
  calculateTotals,
  issueInvoiceOnPO,
  recordInvoiceInLedger,
} from './hooks'
import { requestQuoteEndpoint, submitPOEndpoint } from './endpoints'

// Prices stay hidden from the customer until they have entered their PO number
const pricesVisible: FieldAccess = ({ req: { user }, doc }) =>
  isStaffUser(user) || Boolean(doc?.poNumber)

const priceFieldAccess = { read: pricesVisible, create: staffOnlyField, update: staffOnlyField }

export const orderStatusOptions = [
  { label: 'Submitted (awaiting prices)', value: 'submitted' },
  { label: 'Priced (awaiting PO)', value: 'priced' },
  { label: 'Invoiced', value: 'invoiced' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
]

// Quote requests that become invoiced orders. Customers never write to this collection
// directly: they use the /request and /:id/po endpoints, which validate every change.
export const Orders: CollectionConfig<'orders'> = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  access: {
    create: staffOnly,
    read: staffOrOwnCustomer('customer'),
    update: staffOnly,
    delete: staffOnly,
  },
  admin: {
    defaultColumns: ['orderNumber', 'customer', 'status', 'total', 'updatedAt'],
    useAsTitle: 'orderNumber',
    description:
      'Quote requests from customers. Enter a unit price for every item: the status changes to Priced and the customer can then submit their PO number, which issues the invoice.',
  },
  defaultSort: '-createdAt',
  endpoints: [requestQuoteEndpoint, submitPOEndpoint],
  hooks: {
    beforeChange: [assignOrderNumber, calculateTotals, issueInvoiceOnPO],
    afterChange: [recordInvoiceInLedger],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          type: 'text',
          unique: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'submitted',
          options: orderStatusOptions,
          required: true,
        },
      ],
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products', required: true },
            {
              name: 'quantity',
              label: 'Quantity (bags)',
              type: 'number',
              min: 1,
              required: true,
            },
            {
              name: 'unitPrice',
              label: 'Unit price (₦ per bag)',
              type: 'number',
              min: 0,
              access: priceFieldAccess,
            },
            {
              name: 'lineTotal',
              label: 'Line total (₦)',
              type: 'number',
              access: { ...priceFieldAccess, update: () => false },
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'deliveryLocation', type: 'text' },
        {
          name: 'total',
          label: 'Total (₦)',
          type: 'number',
          access: { ...priceFieldAccess, update: () => false },
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'notes',
      label: 'Customer notes',
      type: 'textarea',
    },
    {
      name: 'poNumber',
      label: 'PO / LPO number',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Entered by the customer after pricing. Saving one issues the invoice.',
      },
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'invoiceDate',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayOnly' } },
    },
  ],
  timestamps: true,
}
