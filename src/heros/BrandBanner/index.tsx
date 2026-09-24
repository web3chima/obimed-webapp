'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'
import { BrandHeroLinks } from '@/heros/BrandHeroLinks'

// Purple page banner with the brochure's green diagonal, for inner pages
export const BrandBannerHero: React.FC<Page['hero']> = ({ links, richText }) => {
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
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[60%] bg-white/5 [clip-path:polygon(35%_100%,100%_0,100%_20%,55%_100%)]"
      />
      <div className="container relative pt-[9rem] md:pt-[10rem] pb-16 md:pb-24">
        {richText && (
          <RichText
            className="max-w-3xl prose-h1:font-bold prose-h1:leading-tight prose-h1:text-[2.25rem] md:prose-h1:text-[3.25rem] prose-p:text-white/85 prose-p:text-lg"
            data={richText}
            enableGutter={false}
          />
        )}
        <BrandHeroLinks className="mt-8" links={links} />
      </div>
    </section>
  )
}
