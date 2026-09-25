import type { CollectionConfig, FieldAccess } from 'payload'

import {
  hasRole,
  salesOrOwnCustomer,
  salesStaff,
  salesStaffField,
  superAdminField,
} from '../../access/roles'
import {
  assignOrderNumber,
  calculateTotals,
  creditCancelledInvoice,
  enforceOrderRules,
  issueInvoiceOnPO,
  notifyOrderChanges,
  recordInvoiceInLedger,
} from './hooks'
import { requestQuoteEndpoint, submitPOEndpoint } from './endpoints'

// Prices stay hidden from the customer until they have entered their PO number
const pricesVisible: FieldAccess = ({ req: { user }, doc }) =>
  hasRole(user, 'sales') || Boolean(doc?.poNumber)

const priceFieldAccess = { read: pricesVisible, create: salesStaffField, update: salesStaffField }

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
    // Customers order through /api/orders/request; sales staff may also enter an order for an
    // approved customer (e.g. a PO received by phone)
    create: salesStaff,
    read: salesOrOwnCustomer('customer'),
    update: salesStaff,
    delete: salesStaff,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['orderNumber', 'customer', 'status', 'total', 'updatedAt'],
    useAsTitle: 'orderNumber',
    description:
      'Quote requests from customers (or entered by staff for an approved customer). Open one and follow the instructions at the top.',
    components: {
      beforeListTable: ['@/collections/Orders/admin/StatusTabs#StatusTabs'],
    },
  },
  defaultSort: '-createdAt',
  endpoints: [requestQuoteEndpoint, submitPOEndpoint],
  hooks: {
    beforeChange: [assignOrderNumber, calculateTotals, issueInvoiceOnPO, enforceOrderRules],
    afterChange: [recordInvoiceInLedger, creditCancelledInvoice, notifyOrderChanges],
  },
  fields: [
    {
      name: 'nextStep',
      type: 'ui',
      admin: {
        components: { Field: '@/collections/Orders/admin/NextStep#NextStep' },
      },
    },
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
          admin: {
            description:
              'Moves forward only. Priced, Invoiced and Paid are set automatically; you can set Delivered, or Cancelled (after invoicing, a credit note is added to the ledger).',
          },
        },
      ],
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      // Chosen when a staff member creates the order; fixed afterwards
      access: { update: () => false },
      filterOptions: { approved: { equals: true } },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      admin: {
        isSortable: false,
        components: { RowLabel: '@/collections/Orders/admin/ItemRowLabel#ItemRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
              // Only a super admin may adjust a request, and only while it awaits prices
              access: { update: superAdminField },
            },
            {
              name: 'quantity',
              label: 'Quantity (bags)',
              type: 'number',
              min: 1,
              required: true,
              access: { update: superAdminField },
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
        description:
          'Entered by the customer after pricing. If they sent it to you, type it here and Save to issue the invoice. Fixed once invoiced.',
        condition: (data) => data?.status !== 'submitted',
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
