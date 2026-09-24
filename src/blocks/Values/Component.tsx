import React from 'react'

import type { ValuesBlock as ValuesBlockProps } from '@/payload-types'

import { BrandIcon } from '@/components/BrandIcon'
import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'

export const ValuesBlock: React.FC<ValuesBlockProps> = ({ eyebrow, heading, intro, items }) => {
  return (
    <section
      className="relative overflow-hidden bg-brand-purple-dark py-20 md:py-28 text-white"
      data-theme="dark"
    >
      <div
        aria-hidden
        className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-brand-purple blur-3xl opacity-60"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-brand-green/25 blur-3xl"
      />
      <div className="container relative">
        <SectionHeading
          align="center"
          className="mb-12 md:mb-16"
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((item, i) => (
            <Reveal as="li" delay={(i % 3) * 120} key={item.id || i}>
              <div className="group relative h-full rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/60 hover:bg-white/10 hover:shadow-[0_0_40px_-10px_var(--brand-green)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green transition-colors group-hover:bg-brand-green group-hover:text-[#241c52]">
                    <BrandIcon className="h-6 w-6" icon={item.icon} />
                  </span>
                  <span className="font-heading text-sm font-bold text-white/30">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
