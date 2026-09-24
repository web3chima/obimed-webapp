import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

// Obimed staff only. Customers can also log in (the `customers` collection), so a plain
// "is anyone logged in" check would let them edit site content.
export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return user?.collection === 'users'
}
