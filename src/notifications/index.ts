import type { Payload } from 'payload'

import type { Customer, Order } from '@/payload-types'

import { formatDate, formatNaira } from '@/utilities/format'
import { getServerSideURL } from '@/utilities/getURL'
import { siteConfig } from '@/utilities/siteConfig'

type Message = {
  to: string | string[]
  subject: string
  heading: string
  lines: string[]
  action?: { label: string; url: string }
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const renderHTML = ({ action, heading, lines }: Message) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f7f6fb;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:#483998;padding:20px 28px;border-bottom:6px solid #96bb49">
      <span style="color:#ffffff;font-size:20px;font-weight:bold">${escape(siteConfig.name)}</span>
    </div>
    <div style="padding:28px;color:#4b4b4d;font-size:15px;line-height:1.6">
      <h1 style="color:#2f2566;font-size:20px;margin:0 0 16px">${escape(heading)}</h1>
      ${lines.map((line) => `<p style="margin:0 0 12px">${escape(line)}</p>`).join('')}
      ${
        action
          ? `<p style="margin:24px 0 0"><a href="${escape(action.url)}" style="background:#483998;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escape(action.label)}</a></p>`
          : ''
      }
    </div>
    <div style="padding:16px 28px;background:#f7f6fb;color:#66666b;font-size:12px">
      ${escape(siteConfig.address)} · ${escape(siteConfig.email)} · RC ${siteConfig.rcNumber}
    </div>
  </div>
</div>`

const renderText = ({ action, heading, lines }: Message) =>
  [heading, '', ...lines, ...(action ? ['', `${action.label}: ${action.url}`] : [])].join('\n')

// Never let a failed email break the order action that triggered it
export const sendNotification = async (payload: Payload, message: Message) => {
  const to = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean)
  if (to.length === 0) return
  try {
    await payload.sendEmail({
      to,
      subject: message.subject,
      html: renderHTML(message),
      text: renderText(message),
    })
  } catch (err) {
    payload.logger.error({ err, msg: `Failed to send notification: ${message.subject}` })
  }
}

const staffEmails = async (payload: Payload) => {
  const settings = await payload.findGlobal({ slug: 'invoice-settings', overrideAccess: true })
  const configured = (settings.notifyEmails || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
  return configured.length > 0 ? configured : [siteConfig.email]
}

const customerOf = async (payload: Payload, order: Order): Promise<Customer | null> => {
  if (typeof order.customer === 'object') return order.customer
  return payload
    .findByID({ collection: 'customers', id: order.customer, depth: 0, overrideAccess: true })
    .catch(() => null)
}

const site = () => getServerSideURL()
const orderLink = (order: Order) => `${site()}/account/orders/${order.id}`
const adminLink = (collection: string, id: number) =>
  `${site()}/admin/collections/${collection}/${id}`

// ---- Customer account ------------------------------------------------------------------

export const notifyNewRegistration = async (payload: Payload, customer: Customer) =>
  sendNotification(payload, {
    to: await staffEmails(payload),
    subject: `New customer registration: ${customer.company}`,
    heading: 'A new customer is waiting for approval',
    lines: [
      `${customer.company} (${customer.name}, ${customer.phone}, ${customer.email}) created an account.`,
      'Approve it in the admin so they can sign in and request quotes.',
    ],
    action: { label: 'Review account', url: adminLink('customers', customer.id) },
  })

export const notifyAccountApproved = async (payload: Payload, customer: Customer) =>
  sendNotification(payload, {
    to: customer.email,
    subject: 'Your Obimed account is approved',
    heading: `Welcome, ${customer.name}`,
    lines: [
      `Your account for ${customer.company} is now active.`,
      'You can sign in to request quotes, submit PO numbers and download invoices.',
    ],
    action: { label: 'Sign in', url: `${site()}/account/login` },
  })

// ---- Order lifecycle -------------------------------------------------------------------

export const notifyOrderSubmitted = async (payload: Payload, order: Order) => {
  const customer = await customerOf(payload, order)
  await sendNotification(payload, {
    to: await staffEmails(payload),
    subject: `New quote request ${order.orderNumber} from ${customer?.company ?? 'a customer'}`,
    heading: `New quote request ${order.orderNumber}`,
    lines: [
      `${customer?.company} requested ${order.items.length} product(s).`,
      'Enter a unit price for every item to send it to the customer for their PO number.',
    ],
    action: { label: 'Price the order', url: adminLink('orders', order.id) },
  })
  if (customer) {
    await sendNotification(payload, {
      to: customer.email,
      subject: `We received your quote request ${order.orderNumber}`,
      heading: 'Thank you for your request',
      lines: [
        `We have received quote request ${order.orderNumber} and are preparing prices.`,
        'We will email you as soon as it is ready for your PO number.',
      ],
      action: { label: 'Track your order', url: orderLink(order) },
    })
  }
}

export const notifyOrderPriced = async (payload: Payload, order: Order) => {
  const customer = await customerOf(payload, order)
  if (!customer) return
  await sendNotification(payload, {
    to: customer.email,
    subject: `Your order ${order.orderNumber} is priced`,
    heading: 'Your order is ready for your PO number',
    lines: [
      `We have priced quote request ${order.orderNumber}.`,
      'Sign in and enter your PO / LPO number to see the prices and receive your invoice.',
    ],
    action: { label: 'Enter PO number', url: orderLink(order) },
  })
}

export const notifyInvoiceIssued = async (payload: Payload, order: Order) => {
  const customer = await customerOf(payload, order)
  await sendNotification(payload, {
    to: await staffEmails(payload),
    subject: `PO received: ${order.invoiceNumber} for ${customer?.company ?? 'a customer'}`,
    heading: `PO ${order.poNumber} received`,
    lines: [
      `${customer?.company} submitted PO ${order.poNumber} for ${order.orderNumber}.`,
      `Invoice ${order.invoiceNumber} for ${formatNaira(order.total)} was issued, due ${formatDate(order.dueDate)}.`,
    ],
    action: { label: 'Open the order', url: adminLink('orders', order.id) },
  })
  if (customer) {
    await sendNotification(payload, {
      to: customer.email,
      subject: `Invoice ${order.invoiceNumber} for PO ${order.poNumber}`,
      heading: `Invoice ${order.invoiceNumber}`,
      lines: [
        `Thank you for PO ${order.poNumber}. Your invoice for ${formatNaira(order.total)} is ready.`,
        `Payment is due by ${formatDate(order.dueDate)}. Please quote ${order.invoiceNumber} as your payment reference.`,
      ],
      action: { label: 'View & print invoice', url: `${orderLink(order)}/invoice` },
    })
  }
}

const statusMessages: Partial<Record<Order['status'], (order: Order) => Omit<Message, 'to'>>> = {
  delivered: (order) => ({
    subject: `Order ${order.orderNumber} delivered`,
    heading: 'Your order has been delivered',
    lines: [
      `Order ${order.orderNumber} (PO ${order.poNumber}) has been delivered.`,
      'Please inspect the goods. Report quantity issues within 7 days and quality issues within 15 days.',
    ],
  }),
  paid: (order) => ({
    subject: `Invoice ${order.invoiceNumber} paid in full`,
    heading: 'Thank you for your payment',
    lines: [
      `We have received full payment for invoice ${order.invoiceNumber}. This order is complete.`,
    ],
  }),
  cancelled: (order) => ({
    subject: `Order ${order.orderNumber} cancelled`,
    heading: 'Your order has been cancelled',
    lines: [`Order ${order.orderNumber} has been cancelled. Contact us if you have any questions.`],
  }),
}

export const notifyStatusChange = async (payload: Payload, order: Order) => {
  const build = statusMessages[order.status]
  const customer = build ? await customerOf(payload, order) : null
  if (!build || !customer) return
  await sendNotification(payload, {
    to: customer.email,
    ...build(order),
    action: { label: 'View your order', url: orderLink(order) },
  })
}

export const notifyPaymentReceived = async (
  payload: Payload,
  customer: Customer,
  amount: number,
  reference: string,
  balance: number,
) =>
  sendNotification(payload, {
    to: customer.email,
    subject: `Payment received: ${formatNaira(amount)}`,
    heading: 'Payment received',
    lines: [
      `We have recorded your payment of ${formatNaira(amount)}${reference ? ` (${reference})` : ''}.`,
      `Your outstanding balance is now ${formatNaira(balance)}.`,
    ],
    action: { label: 'View your account', url: `${site()}/account` },
  })
