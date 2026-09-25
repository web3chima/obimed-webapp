'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const tabs = [
  { label: 'Awaiting prices', status: 'submitted' },
  { label: 'Awaiting PO', status: 'priced' },
  { label: 'Invoiced', status: 'invoiced' },
  { label: 'Delivered', status: 'delivered' },
  { label: 'Paid', status: 'paid' },
  { label: 'Cancelled', status: 'cancelled' },
  { label: 'Expired', status: 'expired' },
  { label: 'All', status: '' },
]

// Quick status filters above the orders list
export const StatusTabs: React.FC = () => {
  const current = useSearchParams().get('where[status][equals]') || ''

  return (
    <nav
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
      aria-label="Filter orders"
    >
      {tabs.map(({ label, status }) => {
        const active = status === current
        return (
          <Link
            href={status ? `?where[status][equals]=${status}` : '?'}
            key={label}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: `1px solid ${active ? '#483998' : 'var(--theme-elevation-150)'}`,
              background: active ? '#483998' : 'transparent',
              color: active ? '#ffffff' : 'var(--theme-text)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
