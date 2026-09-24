'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Submitting the PO number reveals the prices and issues the invoice
export const POForm: React.FC<{ orderId: number }> = ({ orderId }) => {
  const router = useRouter()
  const [poNumber, setPONumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/orders/${orderId}/po`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poNumber }),
    })
    setBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body?.error || 'We could not submit your PO number. Please try again.')
      return
    }
    router.refresh()
  }

  return (
    <form
      className="rounded-2xl border-2 border-brand-purple bg-accent p-6 md:p-8"
      onSubmit={submit}
    >
      <h2 className="font-heading text-xl font-bold">Your order has been priced</h2>
      <p className="mt-2 max-w-xl">
        Enter your Purchase Order (PO / LPO) number to see the prices and receive your invoice.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="poNumber">PO / LPO number</Label>
          <Input
            id="poNumber"
            maxLength={64}
            onChange={(e) => setPONumber(e.target.value)}
            required
            value={poNumber}
          />
        </div>
        <Button className="font-heading font-semibold" disabled={busy} size="lg" type="submit">
          {busy ? 'Submitting…' : 'Submit PO & view invoice'}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
