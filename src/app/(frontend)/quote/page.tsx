import type { Metadata } from 'next'

import React from 'react'

import { QuoteRequest } from '@/components/Products/QuoteRequest'
import { getCustomer } from '@/utilities/getCustomer'

export default async function QuotePage() {
  const customer = await getCustomer()

  return (
    <div className="pt-8 pb-24">
      <div className="container">
        <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
          Request a quote
        </p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">Your quote request</h1>
        <p className="mt-4 mb-10 max-w-2xl text-lg">
          Confirm the number of bags and submit your request from your customer account. We price
          it, then you enter your PO number to receive the invoice.
        </p>
        <QuoteRequest
          customer={
            customer
              ? { company: customer.company, name: customer.name, address: customer.address }
              : null
          }
        />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Request a Quote',
  description:
    'Request pricing for APIs, excipients and food-grade raw materials from Obimed Pharmaceutical Ltd.',
}
