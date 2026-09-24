'use client'

import React, { useEffect, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardListIcon, MenuIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react'
import { useQuoteBasket } from '@/providers/QuoteBasket'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { items } = useQuoteBasket()

  const quoteLink = (
    <Link href="/quote" className="relative p-2 text-heading hover:text-primary transition-colors">
      <span className="sr-only">Quote basket ({items.length} items)</span>
      <ClipboardListIcon className="w-5" />
      {items.length > 0 && (
        <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[0.65rem] font-bold text-[#241c52]">
          {items.length}
        </span>
      )}
    </Link>
  )

  const accountLink = (
    <Link href="/account" className="p-2 text-heading hover:text-primary transition-colors">
      <span className="sr-only">My account</span>
      <UserIcon className="w-5" />
    </Link>
  )

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <nav className="hidden lg:flex gap-7 items-center font-heading text-sm font-semibold">
        {navItems.map(({ link }, i) => {
          return (
            <CMSLink
              key={i}
              {...link}
              appearance="inline"
              className="text-heading hover:text-primary transition-colors"
            />
          )
        })}
        <Link href="/search" className="text-heading hover:text-primary transition-colors">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5" />
        </Link>
        {quoteLink}
        {accountLink}
        <Button asChild>
          <Link href="/quote">Request a Quote</Link>
        </Button>
      </nav>

      <div className="flex lg:hidden items-center gap-2">
        <Link href="/search" className="p-2 text-heading">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5" />
        </Link>
        {quoteLink}
        {accountLink}
        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          className="p-2 text-heading"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          {open ? <XIcon className="w-6" /> : <MenuIcon className="w-6" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="lg:hidden absolute inset-x-0 top-full mx-4 rounded-lg border border-border bg-background shadow-lg p-4"
        >
          <nav className="flex flex-col font-heading font-semibold">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  key={i}
                  {...link}
                  appearance="inline"
                  className="py-3 border-b border-border text-heading"
                />
              )
            })}
          </nav>
          <Button asChild className="w-full mt-4">
            <Link href="/quote">Request a Quote</Link>
          </Button>
        </div>
      )}
    </>
  )
}
