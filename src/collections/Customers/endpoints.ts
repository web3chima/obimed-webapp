import type { Endpoint } from 'payload'

import { endCustomerSession, sessionCookie } from '@/auth/customerSession'

const readBody = async (req: Parameters<Endpoint['handler']>[0]) => {
  try {
    return ((await req.json?.()) as Record<string, unknown>) || {}
  } catch {
    return {}
  }
}

// POST /api/customers/session — sign in; the session goes in the customer's own cookie
export const customerSignIn: Endpoint = {
  path: '/session',
  method: 'post',
  handler: async (req) => {
    const body = await readBody(req)
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password) {
      return Response.json({ error: 'Enter your email and password.' }, { status: 400 })
    }

    try {
      const { exp, token, user } = await req.payload.login({
        collection: 'customers',
        data: { email, password },
        req,
      })
      if (!token || !exp) throw new Error('No token issued')
      return Response.json(
        { company: user?.company },
        { headers: { 'Set-Cookie': sessionCookie(token, exp - Date.now() / 1000) } },
      )
    } catch (err) {
      // Approval errors carry a customer-facing message; everything else is a generic failure
      const message =
        err instanceof Error && err.message.includes('awaiting approval')
          ? err.message
          : 'Email or password is incorrect.'
      return Response.json({ error: message }, { status: 401 })
    }
  },
}

// DELETE /api/customers/session — sign out and revoke the session
export const customerSignOut: Endpoint = {
  path: '/session',
  method: 'delete',
  handler: async (req) => {
    await endCustomerSession(req.payload, req.headers)
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('', 0) } })
  },
}
