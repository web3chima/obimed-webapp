import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import {
  notifyAccountApproved,
  notifyNewRegistration,
  notifyPaymentTermsChanged,
  passwordResetEmailHTML,
} from '@/notifications'

import { isCustomerUser, hasRole, salesStaff, salesStaffField } from '../../access/roles'
import {
  customerForgotPassword,
  customerResetPassword,
  customerSignIn,
  customerSignOut,
} from './endpoints'
import {
  DEFAULT_CREDIT_DAYS,
  paymentTermsOptions,
  termsLabel,
} from '../Orders/terms'

// Manufacturer accounts for ordering, POs, invoices and the ledger. Separate from staff `users`.
export const Customers: CollectionConfig<'customers'> = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailSubject: () => 'Reset your Obimed password',
      generateEmailHTML: (args) =>
        passwordResetEmailHTML(args?.token ?? '', (args?.user as { name?: string })?.name),
    },
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
  endpoints: [customerSignIn, customerSignOut, customerForgotPassword, customerResetPassword],
  hooks: {
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation === 'create') await notifyNewRegistration(req.payload, doc)
        // Approval email includes the payment terms set at that time
        else if (doc.approved && !previousDoc?.approved)
          await notifyAccountApproved(req.payload, doc)
        // Terms changed later on an active account: tell the customer their new terms
        else if (doc.approved && termsLabel(doc) !== termsLabel(previousDoc))
          await notifyPaymentTermsChanged(req.payload, doc)
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
      name: 'paymentTerms',
      label: 'Payment terms',
      type: 'select',
      required: true,
      defaultValue: 'prepaid',
      options: paymentTermsOptions,
      access: { create: salesStaffField, update: salesStaffField },
      admin: {
        position: 'sidebar',
        description:
          'Most customers pay before delivery; grant credit only to trusted accounts. Set it before or when you tick Approved: the approval email states these terms. Changing it later emails the customer; it applies to invoices issued from then on.',
      },
    },
    {
      name: 'creditDays',
      label: 'Credit days',
      type: 'number',
      defaultValue: DEFAULT_CREDIT_DAYS,
      min: 1,
      access: { create: salesStaffField, update: salesStaffField },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.paymentTerms === 'credit',
        description: 'Payment is due this many days after delivery.',
      },
    },
  ],
  timestamps: true,
}
