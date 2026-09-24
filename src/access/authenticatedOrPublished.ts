import type { Access } from 'payload'

// Staff see drafts; everyone else (including logged-in customers) sees published content only
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user?.collection === 'users') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
