import type { GlobalConfig } from 'payload'

import { isCustomerUser, isStaffUser, staffOnly } from '../access/roles'

// Bank details and notes printed on every invoice
export const InvoiceSettings: GlobalConfig = {
  slug: 'invoice-settings',
  label: 'Invoice settings',
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
      name: 'notes',
      label: 'Invoice footer note',
      type: 'textarea',
      defaultValue:
        'Please quote the invoice number as your payment reference. Payment is due by the date shown above.',
    },
  ],
}
