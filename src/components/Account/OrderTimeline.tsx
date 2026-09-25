import React from 'react'
import { CheckIcon } from 'lucide-react'

import type { Order } from '@/payload-types'

import { cn } from '@/utilities/ui'

const steps: { status: Order['status']; label: string }[] = [
  { status: 'submitted', label: 'Request received' },
  { status: 'priced', label: 'Priced' },
  { status: 'invoiced', label: 'PO & invoice' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'paid', label: 'Paid' },
]

// Where the order is in its life, from request to payment
export const OrderTimeline: React.FC<{ status: Order['status'] }> = ({ status }) => {
  if (status === 'cancelled' || status === 'expired') {
    return (
      <p className="rounded-xl border border-border bg-card px-5 py-4 font-semibold">
        {status === 'cancelled'
          ? 'This order was cancelled.'
          : 'This invoice expired because the goods were not delivered within 7 days. You owe nothing on it; please submit a new request.'}
      </p>
    )
  }

  const current = steps.findIndex((step) => step.status === status)

  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Order progress">
      {steps.map((step, i) => {
        const done = i < current || status === 'paid'
        const active = i === current && status !== 'paid'
        return (
          <li className="flex flex-col items-center gap-2 text-center" key={step.status}>
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'h-1 flex-1',
                  i === 0 ? 'invisible' : done || active ? 'bg-brand-purple' : 'bg-border',
                )}
              />
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                  done && 'border-brand-purple bg-brand-purple text-white',
                  active && 'border-brand-purple bg-brand-green text-[#241c52]',
                  !done && !active && 'border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'h-1 flex-1',
                  i === steps.length - 1 ? 'invisible' : done ? 'bg-brand-purple' : 'bg-border',
                )}
              />
            </div>
            <span
              className={cn(
                'text-xs font-semibold',
                active ? 'text-heading' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
