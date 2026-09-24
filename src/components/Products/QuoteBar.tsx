'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { ArrowRightIcon, ClipboardListIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuoteBasket } from '@/providers/QuoteBasket'

// Sticky bar that appears once a product is added to the quote basket
export const QuoteBar: React.FC = () => {
  const { items } = useQuoteBasket()
  const pathname = usePathname()

  if (items.length === 0 || pathname === '/quote' || pathname.startsWith('/admin')) return null

  const names = items.map((item) => item.title).join(', ')

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 md:p-4 pointer-events-none print:hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="container pointer-events-auto">
        <div className="flex items-center gap-4 rounded-xl bg-brand-purple text-white shadow-2xl px-4 py-3 md:px-6">
          <span className="relative hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <ClipboardListIcon className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-xs font-bold text-[#241c52]">
              {items.length}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold">
              {items.length} {items.length === 1 ? 'product' : 'products'} in your quote
            </p>
            <p className="truncate text-xs text-white/75">{names}</p>
          </div>
          <Button
            asChild
            className="shrink-0 bg-brand-green text-[#241c52] hover:bg-brand-green/90 font-heading font-semibold"
          >
            <Link href="/quote">
              <span className="hidden sm:inline">Continue to quote</span>
              <span className="sm:hidden">Continue</span>
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
