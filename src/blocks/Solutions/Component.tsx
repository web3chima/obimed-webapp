'use client'
import React, { useState } from 'react'
import { ArrowRightIcon, PlusIcon } from 'lucide-react'

import type { SolutionsBlock as SolutionsBlockProps } from '@/payload-types'

import { BrandIcon } from '@/components/BrandIcon'
import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/SectionHeading'
import { cn } from '@/utilities/ui'

export const SolutionsBlock: React.FC<SolutionsBlockProps> = ({
  eyebrow,
  heading,
  intro,
  items,
}) => {
  return (
    <section className="bg-card py-20 md:py-28 scroll-mt-8" id="solutions">
      <div className="container">
        <SectionHeading
          className="mb-12 md:mb-16"
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
        />

        <ol className="grid gap-6 lg:grid-cols-3">
          {items?.map((item, i) => (
            <SolutionCard index={i} item={item} key={item.id || i} />
          ))}
        </ol>
      </div>
    </section>
  )
}

type Item = NonNullable<SolutionsBlockProps['items']>[number]

const SolutionCard: React.FC<{ index: number; item: Item }> = ({ index, item }) => {
  const [open, setOpen] = useState(false)
  const detailId = `solution-detail-${item.id || index}`

  return (
    <li
      className={cn(
        'reveal-card relative flex flex-col rounded-2xl border border-border bg-background p-7 md:p-8 shadow-sm',
        'transition-all duration-300',
        'card-self-active:-translate-y-1 card-self-active:shadow-xl card-self-active:bg-brand-purple card-self-active:border-brand-purple',
      )}
      data-open={open || undefined}
    >
      <div className="flex items-start justify-between mb-6">
        <span
          className={cn(
            'inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary transition-colors',
            'card-active:bg-brand-green card-active:text-[#241c52]',
          )}
        >
          <BrandIcon className="h-6 w-6" icon={item.icon} />
        </span>
        <span className="font-heading text-4xl font-bold text-border transition-colors card-active:text-white/20">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <h3 className={cn('text-xl font-bold mb-3 transition-colors', 'card-active:text-white')}>
        {item.title}
      </h3>
      <p className="leading-relaxed transition-colors card-active:text-white/85">{item.summary}</p>

      {item.detail && (
        <>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-500 ease-out',
              'grid-rows-[0fr] card-active:grid-rows-[1fr]',
            )}
            id={detailId}
          >
            <div className="overflow-hidden">
              <p className="mt-5 border-l-4 border-brand-green pl-4 italic text-white/90">
                {item.detail}
              </p>
            </div>
          </div>
          <button
            aria-controls={detailId}
            aria-expanded={open}
            className={cn(
              'mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary',
              '[@media(hover:hover)]:hidden card-active:text-white',
            )}
            onClick={() => setOpen((o) => !o)}
            type="button"
          >
            <PlusIcon className={cn('h-4 w-4 transition-transform', open && 'rotate-45')} />
            {open ? 'Show less' : 'Why it matters'}
          </button>
        </>
      )}

      {item.link && (item.link.url || item.link.reference) && (
        <div className="mt-auto pt-7">
          <CMSLink
            {...item.link}
            appearance="inline"
            className={cn(
              'inline-flex items-center gap-2 font-heading text-sm font-semibold text-primary',
              'card-active:text-white',
            )}
          >
            <ArrowRightIcon className="h-4 w-4 transition-transform card-active:translate-x-1" />
          </CMSLink>
        </div>
      )}
    </li>
  )
}
