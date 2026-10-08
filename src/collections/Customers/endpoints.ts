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

const GENERIC_RESET_REPLY =
  'If an account exists for that email, we have sent a link to reset the password. Please check your inbox.'

// POST /api/customers/password/forgot — emails a reset link. Always gives the same reply so it
// doesn't reveal which emails have accounts.
export const customerForgotPassword: Endpoint = {
  path: '/password/forgot',
  method: 'post',
  handler: async (req) => {
    const body = await readBody(req)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Enter the email you registered with.' }, { status: 400 })
    }
    try {
      await req.payload.forgotPassword({ collection: 'customers', data: { email }, req })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Customer password reset email failed' })
    }
    return Response.json({ message: GENERIC_RESET_REPLY })
  },
}

// POST /api/customers/password/reset — sets the new password from the emailed link. The customer
// then signs in as usual (no session is started here).
export const customerResetPassword: Endpoint = {
  path: '/password/reset',
  method: 'post',
  handler: async (req) => {
    const body = await readBody(req)
    const token = typeof body.token === 'string' ? body.token : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!token) return Response.json({ error: 'This reset link is incomplete.' }, { status: 400 })
    if (password.length < 8) {
      return Response.json({ error: 'Use at least 8 characters.' }, { status: 400 })
    }
    try {
      await req.payload.resetPassword({
        collection: 'customers',
        data: { token, password },
        overrideAccess: true,
        req,
      })
      return Response.json({ ok: true })
    } catch {
      return Response.json(
        { error: 'This reset link has expired or was already used. Please request a new one.' },
        { status: 400 },
      )
    }
  },
}
