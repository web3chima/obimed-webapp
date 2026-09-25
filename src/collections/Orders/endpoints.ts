import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { getCustomerFromHeaders } from '@/auth/customerSession'

import { expireLapsedInvoices } from './hooks'

const MAX_ITEMS = 50
const MAX_TEXT = 500

const error = (message: string, status = 400) => Response.json({ error: message }, { status })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return ((await req.json?.()) as Record<string, unknown>) || {}
  } catch {
    return {}
  }
}

const text = (value: unknown, max = MAX_TEXT) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

// POST /api/orders/request — a logged-in customer submits a quote request.
// Body: { items: [{ slug, quantity }], deliveryLocation?, notes? }
export const requestQuoteEndpoint: Endpoint = {
  path: '/request',
  method: 'post',
  handler: async (req) => {
    const customer = await getCustomerFromHeaders(req.payload, req.headers)
    if (!customer) return error('Please log in to your customer account.', 401)

    const body = await readBody(req)
    const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : []

    const requested = rawItems
      .map((item: { slug?: unknown; quantity?: unknown }) => ({
        slug: text(item?.slug, 200),
        quantity: Math.floor(Number(item?.quantity)),
      }))
      .filter((item) => item.slug)

    if (requested.length === 0) return error('Add at least one product to your request.')
    if (requested.some((item) => !Number.isFinite(item.quantity) || item.quantity < 1)) {
      return error('Enter a quantity of at least 1 bag for every product.')
    }

    const { docs: products } = await req.payload.find({
      collection: 'products',
      where: { slug: { in: requested.map((item) => item.slug) } },
      limit: MAX_ITEMS,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const bySlug = new Map(products.map((product) => [product.slug, product]))

    const unavailable = requested.filter(
      (item) => bySlug.get(item.slug)?.availability !== 'available',
    )
    if (unavailable.length > 0) {
      return error(
        'Some products in your request are not available. Please remove them and try again.',
      )
    }

    const order = await req.payload.create({
      collection: 'orders',
      data: {
        customer: customer.id,
        status: 'submitted',
        items: requested.map((item) => ({
          product: bySlug.get(item.slug)!.id,
          quantity: item.quantity,
        })),
        deliveryLocation: text(body.deliveryLocation, 200),
        notes: text(body.notes),
      },
      overrideAccess: true,
      req,
    })

    return Response.json({ id: order.id, orderNumber: order.orderNumber }, { status: 201 })
  },
}

// POST /api/orders/:id/po — the customer enters their PO number on a priced order,
// which reveals the prices and issues the invoice (see issueInvoiceOnPO)
export const submitPOEndpoint: Endpoint = {
  path: '/:id/po',
  method: 'post',
  handler: async (req) => {
    const customer = await getCustomerFromHeaders(req.payload, req.headers)
    if (!customer) return error('Please log in to your customer account.', 401)

    const id = Number(req.routeParams?.id)
    const body = await readBody(req)
    const poNumber = text(body.poNumber, 64)
    if (!poNumber) return error('Enter your PO number.')

    const order = await req.payload
      .findByID({ collection: 'orders', id, depth: 0, overrideAccess: true, req })
      .catch(() => null)

    const ownerId = typeof order?.customer === 'object' ? order.customer?.id : order?.customer
    if (!order || ownerId !== customer.id) return error('Order not found.', 404)
    if (order.poNumber) return error('A PO number has already been submitted for this order.', 409)
    if (order.status !== 'priced') {
      return error(
        'This order has not been priced yet. We will let you know when it is ready.',
        409,
      )
    }

    const updated = await req.payload.update({
      collection: 'orders',
      id,
      data: { poNumber },
      overrideAccess: true,
      req,
    })

    return Response.json({ id: updated.id, invoiceNumber: updated.invoiceNumber })
  },
}

// GET /api/orders/expire-invoices — expires invoices not delivered within 7 days.
// Called daily by Vercel Cron (Authorization: Bearer CRON_SECRET) or by sales staff.
export const expireInvoicesEndpoint: Endpoint = {
  path: '/expire-invoices',
  method: 'get',
  handler: async (req) => {
    const secret = process.env.CRON_SECRET
    const fromCron = Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
    if (!fromCron && !hasRole(req.user, 'sales')) return error('Not allowed.', 403)

    const expired = await expireLapsedInvoices(req.payload)
    return Response.json({ expired })
  },
}
