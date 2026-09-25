'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Payload REST errors look like { errors: [{ message }] }
const errorMessage = async (res: Response, fallback: string) => {
  try {
    const body = await res.json()
    return body?.errors?.[0]?.message || body?.error || fallback
  } catch {
    return fallback
  }
}

const Field: React.FC<{
  autoComplete?: string
  id: string
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  value: string
}> = ({ autoComplete, id, label, onChange, required, type = 'text', value }) => (
  <div className="grid gap-1.5">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-destructive"> *</span>}
    </Label>
    <Input
      autoComplete={autoComplete}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      type={type}
      value={value}
    />
  </div>
)

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const next = useSearchParams().get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch('/api/customers/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setBusy(false)
    if (!res.ok) {
      setError(await errorMessage(res, 'Email or password is incorrect.'))
      return
    }
    // Only follow same-site paths
    router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account')
    router.refresh()
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field
        autoComplete="email"
        id="email"
        label="Email"
        onChange={setEmail}
        required
        type="email"
        value={email}
      />
      <Field
        autoComplete="current-password"
        id="password"
        label="Password"
        onChange={setPassword}
        required
        type="password"
        value={password}
      />
      {error && (
        <p className="text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button className="font-heading font-semibold" disabled={busy} size="lg" type="submit">
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-sm">
        New customer?{' '}
        <Link className="font-semibold text-primary hover:underline" href="/account/register">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    company: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (!res.ok) {
      setError(
        await errorMessage(res, 'We could not create your account. Please check your details.'),
      )
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6" role="status">
        <h2 className="font-heading text-xl font-bold">Thank you, {form.name.split(' ')[0]}</h2>
        <p className="mt-2">
          Your account for <strong>{form.company}</strong> has been created and is awaiting approval
          by Obimed. We will contact you on {form.phone} or {form.email} once it is active.
        </p>
        <Link
          className="mt-4 inline-block font-semibold text-primary hover:underline"
          href="/products"
        >
          Browse products in the meantime
        </Link>
      </div>
    )
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field id="company" label="Company" onChange={set('company')} required value={form.company} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          autoComplete="name"
          id="name"
          label="Contact name"
          onChange={set('name')}
          required
          value={form.name}
        />
        <Field
          autoComplete="tel"
          id="phone"
          label="Phone"
          onChange={set('phone')}
          required
          type="tel"
          value={form.phone}
        />
      </div>
      <Field
        autoComplete="email"
        id="email"
        label="Email"
        onChange={set('email')}
        required
        type="email"
        value={form.email}
      />
      <div className="grid gap-1.5">
        <Label htmlFor="address">Delivery address</Label>
        <Textarea
          id="address"
          onChange={(e) => set('address')(e.target.value)}
          rows={2}
          value={form.address}
        />
      </div>
      <Field
        autoComplete="new-password"
        id="password"
        label="Password (at least 8 characters)"
        onChange={set('password')}
        required
        type="password"
        value={form.password}
      />
      {error && (
        <p className="text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button className="font-heading font-semibold" disabled={busy} size="lg" type="submit">
        {busy ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-sm">
        Already have an account?{' '}
        <Link className="font-semibold text-primary hover:underline" href="/account/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export const LogoutButton: React.FC = () => {
  const router = useRouter()
  return (
    <Button
      onClick={async () => {
        await fetch('/api/customers/session', { method: 'DELETE', credentials: 'include' })
        router.push('/account/login')
        router.refresh()
      }}
      size="sm"
      variant="outline"
    >
      Sign out
    </Button>
  )
}
