'use client'
import React, { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import type { ServicesBlock as ServicesBlockProps } from '@/payload-types'

import { SectionHeading } from '@/components/SectionHeading'
import { cn } from '@/utilities/ui'

export const ServicesBlock: React.FC<ServicesBlockProps> = ({ eyebrow, heading, intro, items }) => {
  return (
    <section className="bg-card py-20 md:py-28">
      <div className="container">
        <SectionHeading
          className="mb-12 md:mb-16"
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
        />
        <ul className="grid gap-4 md:grid-cols-2">
          {items?.map((item, i) => (
            <ServiceItem index={i} item={item} key={item.id || i} />
          ))}
        </ul>
      </div>
    </section>
  )
}

type Item = NonNullable<ServicesBlockProps['items']>[number]

const ServiceItem: React.FC<{ index: number; item: Item }> = ({ index, item }) => {
  const [open, setOpen] = useState(false)
  const panelId = `service-${item.id || index}`
  const number = String(index + 1).padStart(2, '0')

  if (item.comingSoon) {
    return (
      <li className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-background p-6">
        <span
          aria-hidden
          className="animate-shimmer pointer-events-none absolute inset-0 animate-[shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent to-transparent"
        />
        <div className="relative flex items-center gap-4">
          <span className="font-heading text-2xl font-bold text-border">{number}</span>
          <h3 className="flex-1 font-heading text-lg font-bold text-heading/70">{item.title}</h3>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            Coming soon
          </span>
        </div>
      </li>
    )
  }

  return (
    <li
      className={cn(
        'reveal-card rounded-xl border border-border bg-background transition-all duration-300',
        'card-self-active:border-brand-purple card-self-active:shadow-lg',
      )}
      data-open={open || undefined}
    >
      <h3>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="flex w-full items-center gap-4 p-6 text-left"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <span className="font-heading text-2xl font-bold text-border transition-colors card-active:text-brand-green-ink">
            {number}
          </span>
          <span className="flex-1 font-heading text-lg font-bold text-heading">{item.title}</span>
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 card-active:rotate-180" />
        </button>
      </h3>
      {item.description && (
        <div
          className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out card-active:grid-rows-[1fr]"
          id={panelId}
        >
          <div className="overflow-hidden">
            <p className="px-6 pb-6 pl-[4.25rem] leading-relaxed">{item.description}</p>
          </div>
        </div>
      )}
    </li>
  )
}
