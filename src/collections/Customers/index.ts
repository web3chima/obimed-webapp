import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { notifyAccountApproved, notifyNewRegistration } from '@/notifications'

import { isCustomerUser, hasRole, salesStaff, salesStaffField } from '../../access/roles'
import { customerSignIn, customerSignOut } from './endpoints'

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
      if (hasRole(user, 'sales')) return true
      if (isCustomerUser(user)) return { id: { equals: user!.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if (hasRole(user, 'sales')) return true
      if (isCustomerUser(user)) return { id: { equals: user!.id } }
      return false
    },
    delete: salesStaff,
    unlock: salesStaff,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['company', 'name', 'email', 'approved', 'createdAt'],
    useAsTitle: 'company',
    description: 'Manufacturer accounts. Approve an account before the customer can log in.',
  },
  endpoints: [customerSignIn, customerSignOut],
  hooks: {
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation === 'create') await notifyNewRegistration(req.payload, doc)
        else if (doc.approved && !previousDoc?.approved)
          await notifyAccountApproved(req.payload, doc)
        return doc
      },
    ],
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
      access: { create: salesStaffField, update: salesStaffField },
      admin: { position: 'sidebar', description: 'Only approved customers can log in.' },
    },
    {
      name: 'creditDays',
      label: 'Payment terms (days)',
      type: 'number',
      defaultValue: 15,
      min: 0,
      access: { create: salesStaffField, update: salesStaffField },
      admin: { position: 'sidebar', description: 'Invoice due date = invoice date + these days.' },
    },
  ],
  timestamps: true,
}
