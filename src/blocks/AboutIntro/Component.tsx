import React from 'react'
import { CheckIcon } from 'lucide-react'

import type { AboutIntroBlock as AboutIntroBlockProps } from '@/payload-types'

import { Reveal } from '@/components/Reveal'
import { SectionHeading } from '@/components/SectionHeading'

export const AboutIntroBlock: React.FC<AboutIntroBlockProps> = ({
  body,
  eyebrow,
  heading,
  listItems,
  listTitle,
}) => {
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim())

  return (
    <section className="py-20 md:py-28">
      <div className="container grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16 items-start">
        <Reveal>
          <SectionHeading className="mb-6" eyebrow={eyebrow} heading={heading} />
          <div className="flex flex-col gap-5 text-lg leading-relaxed">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        {listItems && listItems.length > 0 && (
          <Reveal delay={150}>
            <div className="relative overflow-hidden rounded-2xl bg-brand-purple p-8 text-white shadow-xl">
              <div
                aria-hidden
                className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-green/30"
              />
              {listTitle && (
                <h3 className="relative mb-6 font-heading text-xl font-bold text-white">
                  {listTitle}
                </h3>
              )}
              <ul className="relative flex flex-col gap-4">
                {listItems.map((item, i) => (
                  <li className="flex items-start gap-3" key={item.id || i}>
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-[#241c52]">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
