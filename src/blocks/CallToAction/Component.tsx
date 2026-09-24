import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { BrandHeroLinks } from '@/heros/BrandHeroLinks'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  return (
    <div className="container">
      <div
        className="relative overflow-hidden rounded-2xl bg-brand-purple p-8 md:p-12 text-white flex flex-col gap-8 md:flex-row md:justify-between md:items-center"
        data-theme="dark"
      >
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 bg-brand-green/90 [clip-path:polygon(75%_100%,100%_20%,100%_100%)]"
        />
        <div className="relative max-w-[42rem]">
          {richText && (
            <RichText
              className="mb-0 prose-p:text-white/85 prose-h2:font-bold prose-h2:mt-0"
              data={richText}
              enableGutter={false}
            />
          )}
        </div>
        <BrandHeroLinks className="relative shrink-0" links={links} />
      </div>
    </div>
  )
}
