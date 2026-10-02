import type { Payload } from 'payload'

import type { Customer, Order } from '@/payload-types'

import { formatDateTime, formatNaira } from '@/utilities/format'
import { getServerSideURL } from '@/utilities/getURL'
import { formatPhone, siteConfig } from '@/utilities/siteConfig'

// Which Obimed address an email comes from (and replies go to). All are aliases of info@.
type Sender = 'info' | 'orders' | 'sales' | 'accounts'

const senders: Record<Sender, { name: string; address: string }> = {
  info: { name: 'Obimed Pharmaceutical', address: siteConfig.email },
  orders: { name: 'Obimed Orders', address: siteConfig.emails.orders },
  sales: { name: 'Obimed Sales', address: siteConfig.emails.sales },
  accounts: { name: 'Obimed Accounts', address: siteConfig.emails.accounts },
}

type Message = {
  to: string | string[]
  subject: string
  heading: string
  lines: string[]
  action?: { label: string; url: string }
  from?: Sender
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const font = "'Montserrat','Segoe UI',Arial,Helvetica,sans-serif"
const bodyFont = "'Open Sans','Segoe UI',Arial,Helvetica,sans-serif"

// Table layout and inline styles so it renders the same in Gmail, Outlook and phone mail apps
const renderHTML = ({ action, from = 'info', heading, lines }: Message) => {
  const site = getServerSideURL()
  const sender = senders[from]
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#f2f0f8">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(lines[0] ?? heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0f8;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e1ef">
      <tr><td style="height:6px;background:#483998;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:26px 32px 18px">
        <a href="${site}" style="text-decoration:none"><img src="${site}/brand/obimed-logo.png" width="170" height="51" alt="${escape(siteConfig.name)}" style="display:block;border:0;width:170px;height:auto"></a>
      </td></tr>
      <tr><td style="height:3px;background:#96bb49;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:30px 32px 8px;font-family:${bodyFont};color:#4b4b4d;font-size:15px;line-height:1.65">
        <h1 style="margin:0 0 18px;font-family:${font};font-size:21px;line-height:1.3;color:#2f2566">${escape(heading)}</h1>
        ${lines.map((line) => `<p style="margin:0 0 14px">${escape(line)}</p>`).join('')}
        ${
          action
            ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="border-radius:8px;background:#483998"><a href="${escape(action.url)}" style="display:inline-block;padding:13px 24px;font-family:${font};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${escape(action.label)} &rarr;</a></td></tr></table>`
            : ''
        }
        <p style="margin:26px 0 0;color:#66666b">Kind regards,<br><strong style="color:#2f2566">${escape(sender.name)}</strong><br><a href="mailto:${sender.address}" style="color:#483998;text-decoration:none">${sender.address}</a></p>
      </td></tr>
      <tr><td style="padding:28px 32px 0">&nbsp;</td></tr>
      <tr><td style="background:#2f2566;padding:22px 32px;font-family:${bodyFont};font-size:12px;line-height:1.7;color:#d9d5ec">
        <strong style="font-family:${font};font-size:13px;color:#ffffff">${escape(siteConfig.name)}</strong><br>
        ${escape(siteConfig.address)}<br>
        ${siteConfig.phones.slice(0, 2).map(formatPhone).join(' &middot; ')} &middot; <a href="mailto:${siteConfig.email}" style="color:#c5dc93;text-decoration:none">${siteConfig.email}</a><br>
        <a href="${site}" style="color:#c5dc93;text-decoration:none">${escape(site.replace(/^https?:\/\//, ''))}</a> &middot; RC ${siteConfig.rcNumber}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

const renderText = ({ action, from = 'info', heading, lines }: Message) =>
  [
    heading,
    '',
    ...lines,
    ...(action ? ['', `${action.label}: ${action.url}`] : []),
    '',
    'Kind regards,',
    senders[from].name,
    '',
    `${siteConfig.name} · ${siteConfig.address} · ${siteConfig.email}`,
  ].join('\n')

// Never let a failed email break the order action that triggered it
export const sendNotification = async (payload: Payload, message: Message) => {
  const to = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean)
  if (to.length === 0) return
  const sender = senders[message.from ?? 'info']
  try {
    await payload.sendEmail({
      from: `"${sender.name}" <${sender.address}>`,
      replyTo: sender.address,
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
  return configured.length > 0 ? configured : [siteConfig.emails.sales]
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
    from: 'sales',
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
      from: 'orders',
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
    from: 'orders',
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
      `Invoice ${order.invoiceNumber} for ${formatNaira(order.total)} was issued. Deliver by ${formatDateTime(order.invoiceValidUntil)}; if undelivered and unpaid by then, it expires.`,
    ],
    action: { label: 'Open the order', url: adminLink('orders', order.id) },
  })
  if (customer) {
    await sendNotification(payload, {
      to: customer.email,
      from: 'accounts',
      subject: `Invoice ${order.invoiceNumber} for PO ${order.poNumber}`,
      heading: `Invoice ${order.invoiceNumber}`,
      lines: [
        `Thank you for PO ${order.poNumber}. Your invoice for ${formatNaira(order.total)} is ready.`,
        `We will deliver by ${formatDateTime(order.invoiceValidUntil)}. Payment is due ${customer.creditDays ?? 15} days after delivery; we will confirm the exact date when your goods arrive.`,
        `Please quote ${order.invoiceNumber} as your payment reference.`,
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
      `Order ${order.orderNumber} (PO ${order.poNumber}) was delivered on ${formatDateTime(order.deliveredAt)}.`,
      `Payment for invoice ${order.invoiceNumber} (${formatNaira(order.total)}) is due by ${formatDateTime(order.dueDate)}.`,
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
  expired: (order) => ({
    subject: `Invoice ${order.invoiceNumber} has expired`,
    heading: 'Your invoice has expired',
    lines: [
      `Invoice ${order.invoiceNumber} for order ${order.orderNumber} was valid for delivery until ${formatDateTime(order.invoiceValidUntil)}. The goods were not delivered in that time, so it has expired. You owe nothing on it.`,
      'Please submit a new quote request, or contact us to arrange delivery.',
    ],
  }),
  cancelled: (order) => ({
    subject: `Order ${order.orderNumber} cancelled`,
    heading: 'Your order has been cancelled',
    lines: [`Order ${order.orderNumber} has been cancelled. Contact us if you have any questions.`],
  }),
}

export const notifyStatusChange = async (payload: Payload, order: Order) => {
  if (order.status === 'expired') {
    const company = (await customerOf(payload, order))?.company ?? 'a customer'
    await sendNotification(payload, {
      to: await staffEmails(payload),
      subject: `Invoice ${order.invoiceNumber} expired (${company})`,
      heading: `Invoice ${order.invoiceNumber} expired`,
      lines: [
        `${order.orderNumber} for ${company} was not delivered within the invoice's 7-day validity.`,
        'No payment had been received, so the order is now Expired. Nothing was owed, so the ledger is unchanged.',
      ],
      action: { label: 'Open the order', url: adminLink('orders', order.id) },
    })
  }
  const build = statusMessages[order.status]
  const customer = build ? await customerOf(payload, order) : null
  if (!build || !customer) return
  await sendNotification(payload, {
    to: customer.email,
    from: order.status === 'paid' ? 'accounts' : 'orders',
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
    from: 'accounts',
    subject: `Payment received: ${formatNaira(amount)}`,
    heading: 'Payment received',
    lines: [
      `We have recorded your payment of ${formatNaira(amount)}${reference ? ` (${reference})` : ''}.`,
      `Your outstanding balance is now ${formatNaira(balance)}.`,
    ],
    action: { label: 'View your account', url: `${site()}/account` },
  })
