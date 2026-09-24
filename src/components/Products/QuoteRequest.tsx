'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { LockIcon, PackageSearchIcon, SendIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useQuoteBasket } from '@/providers/QuoteBasket'

export type QuoteCustomer = { company: string; name: string; address?: string | null }

// Quote basket review. Anyone can build a basket; submitting it requires an approved,
// signed-in customer account.
export const QuoteRequest: React.FC<{ customer: QuoteCustomer | null }> = ({ customer }) => {
  const { clear, items, remove, setQuantity } = useQuoteBasket()
  const router = useRouter()
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
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
        deliveryLocation,
        notes,
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
      </div>
    )
  }

  return (
    <form className="grid gap-10 lg:grid-cols-[1.2fr_1fr]" noValidate onSubmit={submitOrder}>
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
            <div className="grid gap-1.5">
              <Label htmlFor="location">Delivery location</Label>
              <Input
                id="location"
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder={customer.address || undefined}
                value={deliveryLocation}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Grade, specifications, delivery timeline, LPO financing…"
                rows={3}
                value={notes}
              />
            </div>
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
          <LockIcon className="mb-3 h-8 w-8 text-primary" />
          <h2 className="font-heading text-xl font-bold">Sign in to submit your request</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Quote requests are for approved customer accounts. Sign in to submit this basket and
            track pricing, your PO and invoices. New to Obimed? Create an account and we will review
            it promptly. Your basket is saved while you do.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="font-heading font-semibold" size="lg">
              <Link href="/account/login?next=/quote">Sign in</Link>
            </Button>
            <Button asChild className="font-heading font-semibold" size="lg" variant="outline">
              <Link href="/account/register">Create an account</Link>
            </Button>
          </div>
        </section>
      )}
    </form>
  )
}
