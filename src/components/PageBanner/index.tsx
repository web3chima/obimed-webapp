'use client'
import React, { useEffect } from 'react'

import { useHeaderTheme } from '@/providers/HeaderTheme'

type Props = {
  eyebrow?: string
  title: string
  intro?: string
}

// Purple banner for code-built pages (CMS pages use the Brand Banner hero)
export const PageBanner: React.FC<Props> = ({ eyebrow, intro, title }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <section
      className="relative -mt-[9rem] md:-mt-[10rem] overflow-hidden bg-brand-purple text-white"
      data-theme="dark"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[60%] bg-brand-green/90 [clip-path:polygon(70%_100%,100%_35%,100%_100%)]"
      />
      <div className="container relative pt-[9rem] md:pt-[10rem] pb-16 md:pb-20">
        {eyebrow && (
          <p className="mb-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg text-white/85">{intro}</p>}
      </div>
    </section>
  )
}
