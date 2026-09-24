import type { Metadata } from 'next'

import { redirect } from 'next/navigation'
import React, { Suspense } from 'react'

import { LoginForm } from '@/components/Account/AuthForms'
import { getCustomer } from '@/utilities/getCustomer'

export default async function LoginPage() {
  if (await getCustomer()) redirect('/account')

  return (
    <div className="container max-w-md pt-8 pb-24">
      <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
        Customer account
      </p>
      <h1 className="mb-8 text-3xl font-bold">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
}
