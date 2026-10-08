import type { Metadata } from 'next'

import React, { Suspense } from 'react'

import { ResetPasswordForm } from '@/components/Account/AuthForms'

export default function ResetPasswordPage() {
  return (
    <div className="container max-w-md pt-8 pb-24">
      <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
        Customer account
      </p>
      <h1 className="mb-8 text-3xl font-bold">Choose a new password</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
}
