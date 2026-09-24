import React from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  align?: 'left' | 'center'
}

// Small green label, section heading and optional intro used at the top of content blocks
export const SectionHeading: React.FC<Props> = ({
  align = 'left',
  className,
  eyebrow,
  heading,
  intro,
}) => {
  if (!eyebrow && !heading && !intro) return null

  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink mb-3">
          {eyebrow}
        </p>
      )}
      {heading && <h2 className="text-3xl md:text-4xl font-bold leading-tight">{heading}</h2>}
      {intro && <p className="mt-5 text-lg leading-relaxed">{intro}</p>}
    </div>
  )
}
