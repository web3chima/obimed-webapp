import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const isStaffUser = (user: PayloadRequest['user']) => user?.collection === 'users'
export const isCustomerUser = (user: PayloadRequest['user']) => user?.collection === 'customers'

export const staffOnly: Access = ({ req: { user } }) => isStaffUser(user)
export const staffOnlyField: FieldAccess = ({ req: { user } }) => isStaffUser(user)

// Staff see everything; a customer sees only documents whose `field` points at them
export const staffOrOwnCustomer =
  (field: string): Access =>
  ({ req: { user } }) => {
    if (isStaffUser(user)) return true
    if (isCustomerUser(user)) return { [field]: { equals: user!.id } }
    return false
  }
