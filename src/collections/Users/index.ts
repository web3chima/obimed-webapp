import type { Access, CollectionConfig, PayloadRequest } from 'payload'

import { APIError } from 'payload'

import {
  isStaffUser,
  isSuperAdmin,
  staffRoleOptions,
  superAdminField,
  superAdmins,
} from '../../access/roles'

// Super admins manage every staff account; other staff can only see and edit their own profile
const superAdminOrSelf: Access = ({ req: { user } }) => {
  if (isSuperAdmin(user)) return true
  if (isStaffUser(user)) return { id: { equals: user!.id } }
  return false
}

const countSuperAdmins = (req: PayloadRequest) =>
  req.payload
    .count({
      collection: 'users',
      where: { role: { equals: 'super-admin' } },
      overrideAccess: true,
      req,
    })
    .then(({ totalDocs }) => totalDocs)

// Staff accounts for the admin panel
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => isStaffUser(user),
    create: superAdmins,
    delete: superAdmins,
    read: superAdminOrSelf,
    update: superAdminOrSelf,
    unlock: superAdmins,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        // The very first account (created on the admin's first run) is the super admin
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
            req,
          })
          if (totalDocs === 0) data.role = 'super-admin'
        }
        // Never demote the last super admin
        if (
          operation === 'update' &&
          originalDoc?.role === 'super-admin' &&
          data.role &&
          data.role !== 'super-admin' &&
          (await countSuperAdmins(req)) <= 1
        ) {
          throw new APIError('There must always be at least one super admin.', 400, undefined, true)
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const target = await req.payload.findByID({
          collection: 'users',
          id,
          overrideAccess: true,
          req,
        })
        if (target.role === 'super-admin' && (await countSuperAdmins(req)) <= 1) {
          throw new APIError('You cannot delete the last super admin.', 400, undefined, true)
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [...staffRoleOptions],
      access: { create: superAdminField, update: superAdminField },
      admin: {
        position: 'sidebar',
        description: 'Only a super admin can change roles.',
      },
    },
  ],
  timestamps: true,
}
