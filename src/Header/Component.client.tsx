'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Follow the page: a purple banner asks for the white (dark) header; every other page,
  // e.g. the customer account, gets the normal header with the colour logo
  useEffect(() => {
    setTheme(headerTheme ?? null)
  }, [headerTheme])

  return (
    <header
      className="container relative z-20 print:hidden"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="h-20 md:h-24 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Logo loading="eager" priority="high" className="h-9 md:h-11" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
