'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {
  MailIcon,
  MessageCircleIcon,
  PackageSearchIcon,
  SendIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useQuoteBasket } from '@/providers/QuoteBasket'
import { siteConfig } from '@/utilities/siteConfig'

type Contact = {
  company: string
  name: string
  phone: string
  email: string
  poNumber: string
  location: string
  notes: string
}

const emptyContact: Contact = {
  company: '',
  name: '',
  phone: '',
  email: '',
  poNumber: '',
  location: '',
  notes: '',
}

export type QuoteCustomer = { company: string; name: string; address?: string | null }

export const QuoteRequest: React.FC<{ customer: QuoteCustomer | null }> = ({ customer }) => {
  const { clear, items, remove, setQuantity } = useQuoteBasket()
  const [contact, setContact] = useState<Contact>(emptyContact)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const update =
    (field: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setContact((c) => ({ ...c, [field]: e.target.value }))

  const buildMessage = () => {
    const productLines = items.map(
      (item, i) =>
        `${i + 1}. ${item.title}: ${item.quantity ? `${item.quantity} bags` : 'quantity to confirm'}${item.packaging ? ` (${item.packaging})` : ''}`,
    )
    const details = [
      `Company: ${contact.company}`,
      `Contact: ${contact.name}`,
      `Phone: ${contact.phone}`,
      contact.email && `Email: ${contact.email}`,
      contact.location && `Delivery location: ${contact.location}`,
      contact.poNumber && `PO / LPO number: ${contact.poNumber}`,
      contact.notes && `Notes: ${contact.notes}`,
    ].filter(Boolean)

    return [
      'Quote request for Obimed Pharmaceutical Ltd.',
      '',
      'Products:',
      ...productLines,
      '',
      ...details,
    ].join('\n')
  }

  const validate = () => {
    if (items.length === 0) return 'Add at least one product to your quote.'
    if (!contact.company.trim() || !contact.name.trim() || !contact.phone.trim())
      return 'Please fill in your company, name and phone number.'
    return null
  }

  const send = (channel: 'whatsapp' | 'email') => {
    const problem = validate()
    setError(problem)
    if (problem) return

    const message = buildMessage()

    if (channel === 'whatsapp') {
      window.open(
        `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } else {
      const subject = encodeURIComponent(`Quote request: ${contact.company}`)
      window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${encodeURIComponent(message)}`
    }
  }

  // Signed-in customers: save the request as an order in their account
  const submitOrder = async () => {
    if (items.some((item) => !(Number(item.quantity) >= 1))) {
      setError('Enter the number of bags for every product.')
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/orders/request', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item) => ({ slug: item.slug, quantity: Number(item.quantity) })),
        deliveryLocation: contact.location,
        notes: contact.notes,
      }),
    })
    const body = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) {
      setError(body?.error || 'We could not submit your request. Please try again.')
      return
    }
    clear()
    router.push(`/account/orders/${body.id}`)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <PackageSearchIcon className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="font-heading text-xl font-bold">Your quote is empty</h2>
        <p className="mt-2">Browse our products and add the raw materials you need.</p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/products">Browse products</Link>
        </Button>
        <p className="mt-6 text-sm">
          Looking for an API or something not listed?{' '}
          <a
            className="font-semibold text-primary underline"
            href={`https://wa.me/${siteConfig.whatsapp}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Message us on WhatsApp
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form
      className="grid gap-10 lg:grid-cols-[1.2fr_1fr]"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (customer) submitOrder()
        else send('whatsapp')
      }}
    >
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">Products</h2>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {items.map((item) => {
            const qtyId = `qty-${item.slug}`
            return (
              <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" key={item.slug}>
                <div className="min-w-0 flex-1">
                  <Link
                    className="font-heading font-semibold text-heading hover:text-primary"
                    href={`/products/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                  {item.packaging && (
                    <p className="text-xs text-muted-foreground">{item.packaging}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="sr-only" htmlFor={qtyId}>
                    Quantity for {item.title}
                  </Label>
                  <Input
                    className="w-28"
                    id={qtyId}
                    inputMode="numeric"
                    min={1}
                    onChange={(e) => setQuantity(item.slug, e.target.value.replace(/\D/g, ''))}
                    placeholder="Bags"
                    step={1}
                    type="number"
                    value={item.quantity}
                  />
                  <span className="text-sm text-muted-foreground">bags</span>
                  <Button
                    aria-label={`Remove ${item.title}`}
                    onClick={() => remove(item.slug)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
        <Link
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          href="/products"
        >
          + Add more products
        </Link>
      </section>

      {customer ? (
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-heading text-xl font-bold">Submit your request</h2>
          <p className="mt-1 mb-5 text-sm">
            Submitting as <strong>{customer.company}</strong> ({customer.name}). We will price your
            request; then you enter your PO number to receive the invoice.
          </p>
          <div className="grid gap-4">
            <Field id="location" label="Delivery location">
              <Input
                id="location"
                onChange={update('location')}
                placeholder={customer.address || undefined}
                value={contact.location}
              />
            </Field>
            <Field id="notes" label="Notes">
              <Textarea
                id="notes"
                onChange={update('notes')}
                placeholder="Grade, specifications, delivery timeline, LPO financing…"
                rows={3}
                value={contact.notes}
              />
            </Field>
          </div>
          {error && (
            <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            className="mt-6 w-full font-heading font-semibold"
            disabled={submitting}
            size="lg"
            type="submit"
          >
            <SendIcon />
            {submitting ? 'Submitting…' : 'Submit quote request'}
          </Button>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-6 rounded-xl border border-primary/30 bg-accent p-4 text-sm">
            <p className="flex items-center gap-2 font-heading font-semibold text-heading">
              <UserIcon className="h-4 w-4" />
              Have a customer account?
            </p>
            <p className="mt-1">
              Sign in to submit this request and track prices, your PO and invoices online.
            </p>
            <div className="mt-3 flex gap-4 font-semibold">
              <Link className="text-primary hover:underline" href="/account/login?next=/quote">
                Sign in
              </Link>
              <Link className="text-primary hover:underline" href="/account/register">
                Create an account
              </Link>
            </div>
          </div>
          <h2 className="font-heading text-xl font-bold mb-5">Or send your details</h2>
          <div className="grid gap-4">
            <Field id="company" label="Company" required>
              <Input id="company" onChange={update('company')} required value={contact.company} />
            </Field>
            <Field id="name" label="Contact name" required>
              <Input id="name" onChange={update('name')} required value={contact.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="phone" label="Phone" required>
                <Input
                  id="phone"
                  inputMode="tel"
                  onChange={update('phone')}
                  required
                  type="tel"
                  value={contact.phone}
                />
              </Field>
              <Field id="email" label="Email">
                <Input id="email" onChange={update('email')} type="email" value={contact.email} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="location" label="Delivery location">
                <Input id="location" onChange={update('location')} value={contact.location} />
              </Field>
              <Field id="poNumber" label="PO / LPO number">
                <Input id="poNumber" onChange={update('poNumber')} value={contact.poNumber} />
              </Field>
            </div>
            <Field id="notes" label="Notes">
              <Textarea
                id="notes"
                onChange={update('notes')}
                placeholder="Grade, specifications, delivery timeline, LPO financing…"
                rows={3}
                value={contact.notes}
              />
            </Field>
          </div>

          {error && (
            <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button className="font-heading font-semibold" size="lg" type="submit">
              <MessageCircleIcon />
              Send via WhatsApp
            </Button>
            <Button
              className="font-heading font-semibold"
              onClick={() => send('email')}
              size="lg"
              type="button"
              variant="outline"
            >
              <MailIcon />
              Send by email
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            We reply with pricing and availability.
          </p>
        </section>
      )}
    </form>
  )
}

const Field: React.FC<{
  children: React.ReactNode
  id: string
  label: string
  required?: boolean
}> = ({ children, id, label, required }) => (
  <div className="grid gap-1.5">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-destructive"> *</span>}
    </Label>
    {children}
  </div>
)
