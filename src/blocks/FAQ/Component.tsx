'use client'
import React, { useState } from 'react'
import { MessageCircleIcon, PlusIcon } from 'lucide-react'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { siteConfig } from '@/utilities/siteConfig'

export const FAQBlock: React.FC<FAQBlockProps> = ({ eyebrow, heading, intro, items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (items || []).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <section className="py-20 md:py-28">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div className="lg:sticky lg:top-8 self-start">
          <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} />
          <Button asChild className="mt-8" size="lg" variant="outline">
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageCircleIcon />
              Ask us on WhatsApp
            </a>
          </Button>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {items?.map((item, i) => {
            const open = openIndex === i
            const panelId = `faq-panel-${item.id || i}`
            const buttonId = `faq-button-${item.id || i}`

            return (
              <li key={item.id || i}>
                <h3>
                  <button
                    aria-controls={panelId}
                    aria-expanded={open}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left font-heading text-lg font-semibold text-heading hover:text-primary transition-colors"
                    id={buttonId}
                    onClick={() => setOpenIndex(open ? null : i)}
                    type="button"
                  >
                    {item.question}
                    <span
                      className={cn(
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300',
                        open
                          ? 'rotate-45 bg-brand-purple border-brand-purple text-white'
                          : 'group-hover:border-primary',
                      )}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <div
                  aria-labelledby={buttonId}
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-500 ease-out',
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                  id={panelId}
                  role="region"
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pr-12 leading-relaxed whitespace-pre-line">{item.answer}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
