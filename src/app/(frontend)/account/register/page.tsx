import type { Metadata } from 'next'

import { redirect } from 'next/navigation'
import React from 'react'

import { RegisterForm } from '@/components/Account/AuthForms'
import { getCustomer } from '@/utilities/getCustomer'

export default async function RegisterPage() {
  if (await getCustomer()) redirect('/account')

  return (
    <div className="container max-w-xl pt-8 pb-24">
      <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
        Customer account
      </p>
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-3 mb-8">
        Manufacturers can request quotes, submit PO numbers and download invoices. Obimed reviews
        and approves every new account.
      </p>
      <RegisterForm />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false },
}
