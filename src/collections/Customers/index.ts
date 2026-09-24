import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { isCustomerUser, isStaffUser, staffOnly, staffOnlyField } from '../../access/roles'

// Manufacturer accounts for ordering, POs, invoices and the ledger. Separate from staff `users`.
export const Customers: CollectionConfig<'customers'> = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    // Anyone can register; the account stays unapproved until staff approve it
    create: () => true,
    read: ({ req: { user } }) => {
      if (isStaffUser(user)) return true
      if (isCustomerUser(user)) return { id: { equals: user!.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if (isStaffUser(user)) return true
      if (isCustomerUser(user)) return { id: { equals: user!.id } }
      return false
    },
    delete: staffOnly,
    unlock: staffOnly,
  },
  admin: {
    defaultColumns: ['company', 'name', 'email', 'approved', 'createdAt'],
    useAsTitle: 'company',
    description: 'Manufacturer accounts. Approve an account before the customer can log in.',
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (!user?.approved) {
          throw new APIError(
            'Your account is awaiting approval by Obimed. We will contact you once it is active.',
            403,
            undefined,
            true,
          )
        }
        return user
      },
    ],
  },
  fields: [
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Contact name', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    {
      name: 'address',
      label: 'Delivery address',
      type: 'textarea',
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      access: { create: staffOnlyField, update: staffOnlyField },
      admin: { position: 'sidebar', description: 'Only approved customers can log in.' },
    },
    {
      name: 'creditDays',
      label: 'Payment terms (days)',
      type: 'number',
      defaultValue: 15,
      min: 0,
      access: { create: staffOnlyField, update: staffOnlyField },
      admin: { position: 'sidebar', description: 'Invoice due date = invoice date + these days.' },
    },
  ],
  timestamps: true,
}
