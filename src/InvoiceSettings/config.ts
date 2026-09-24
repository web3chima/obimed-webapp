import type { GlobalConfig } from 'payload'

import { isCustomerUser, isStaffUser, staffOnly } from '../access/roles'

// Bank details and notes printed on every invoice
export const InvoiceSettings: GlobalConfig = {
  slug: 'invoice-settings',
  label: 'Order & invoice settings',
  admin: {
    group: 'Sales',
    description:
      'Bank details printed on invoices, and who at Obimed receives order notifications.',
  },
  access: {
    read: ({ req: { user } }) => isStaffUser(user) || isCustomerUser(user),
    update: staffOnly,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'bankName', type: 'text' },
        { name: 'accountName', type: 'text' },
        { name: 'accountNumber', type: 'text' },
      ],
    },
    {
      name: 'notifyEmails',
      label: 'Staff notification emails',
      type: 'text',
      admin: {
        description:
          'Who at Obimed is emailed about new registrations, quote requests and POs. Separate several addresses with commas.',
      },
    },
    {
      name: 'notes',
      label: 'Invoice footer note',
      type: 'textarea',
      defaultValue:
        'Please quote the invoice number as your payment reference. Payment is due by the date shown above.',
    },
  ],
}
