import type { GlobalConfig } from 'payload'

import { isCustomerUser, hasRole, salesStaff } from '../access/roles'

// Bank details and notes printed on every invoice
export const InvoiceSettings: GlobalConfig = {
  slug: 'invoice-settings',
  label: 'Order & invoice settings',
  admin: {
    group: 'Sales',
    description:
      'Bank details printed on invoices, staff email alerts, and the invoice footer note. Use the tabs below.',
  },
  access: {
    read: ({ req: { user } }) => hasRole(user, 'sales') || isCustomerUser(user),
    update: salesStaff,
  },
  fields: [
    // Unnamed tabs only group the fields on screen; the stored data keeps the same shape
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Bank details',
          description: 'Printed on every invoice so customers know where to pay.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'bankName', type: 'text' },
                { name: 'accountName', type: 'text' },
                { name: 'accountNumber', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Staff email alerts',
          description:
            'Who at Obimed gets an email when a customer registers, requests a quote, submits a PO, or an invoice expires.',
          fields: [
            {
              name: 'notifyEmails',
              label: 'Staff alert emails',
              type: 'text',
              admin: {
                placeholder: 'sales@example.com, manager@example.com',
                description:
                  'Separate several addresses with commas. If left empty, alerts go to obimedpharmaceuticals@gmail.com.',
              },
            },
          ],
        },
        {
          label: 'Invoice note',
          fields: [
            {
              name: 'notes',
              label: 'Invoice footer note',
              type: 'textarea',
              defaultValue:
                'Please quote the invoice number as your payment reference. Payment is due by the date shown above.',
            },
          ],
        },
      ],
    },
  ],
}
