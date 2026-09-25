import type { Access, FieldAccess, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

// Staff roles. A super admin can do everything, including managing staff accounts and roles.
export const staffRoleOptions = [
  { label: 'Super admin', value: 'super-admin' },
  { label: 'Sales (orders, customers, ledger)', value: 'sales' },
  { label: 'Content editor (pages, products, media)', value: 'editor' },
] as const

export type StaffRole = (typeof staffRoleOptions)[number]['value']

type RequestUser = PayloadRequest['user']

export const isStaffUser = (user: RequestUser) => user?.collection === 'users'
export const isCustomerUser = (user: RequestUser) => user?.collection === 'customers'

const roleOf = (user: RequestUser) => (isStaffUser(user) ? (user as User).role : undefined)

export const isSuperAdmin = (user: RequestUser) => roleOf(user) === 'super-admin'

// True for super admins and for staff holding one of the given roles
export const hasRole = (user: RequestUser, ...roles: StaffRole[]) => {
  const role = roleOf(user)
  return role === 'super-admin' || (Boolean(role) && roles.includes(role as StaffRole))
}

export const staffWith =
  (...roles: StaffRole[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, ...roles)

export const staffWithField =
  (...roles: StaffRole[]): FieldAccess =>
  ({ req: { user } }) =>
    hasRole(user, ...roles)

export const superAdmins: Access = ({ req: { user } }) => isSuperAdmin(user)
export const superAdminField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)

export const contentEditors = staffWith('editor')
export const salesStaff = staffWith('sales')
export const salesStaffField = staffWithField('sales')

// Sales staff see everything; a customer sees only documents whose `field` points at them
export const salesOrOwnCustomer =
  (field: string): Access =>
  ({ req: { user } }) => {
    if (hasRole(user, 'sales')) return true
    if (isCustomerUser(user)) return { [field]: { equals: user!.id } }
    return false
  }
