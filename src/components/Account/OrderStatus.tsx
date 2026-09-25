import React from 'react'

import type { Order } from '@/payload-types'

import { cn } from '@/utilities/ui'

const labels: Record<Order['status'], string> = {
  submitted: 'Awaiting prices',
  priced: 'Priced — enter PO',
  invoiced: 'Invoiced',
  delivered: 'Delivered',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Invoice expired',
}

const tones: Record<Order['status'], string> = {
  submitted: 'bg-muted text-muted-foreground',
  priced: 'bg-brand-purple text-white',
  invoiced: 'bg-accent text-accent-foreground',
  delivered: 'bg-accent text-accent-foreground',
  paid: 'bg-brand-green text-[#241c52]',
  cancelled: 'bg-muted text-muted-foreground line-through',
  expired: 'bg-muted text-muted-foreground',
}

export const OrderStatus: React.FC<{ status: Order['status'] }> = ({ status }) => (
  <span
    className={cn(
      'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
      tones[status],
    )}
  >
    {labels[status]}
  </span>
)
