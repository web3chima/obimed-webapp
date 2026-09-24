import React from 'react'

import type { CallToActionBlock, Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

// Buttons on purple backgrounds (heroes, call-to-action panels): "default" links are green, "outline" links are white outlines
export const BrandHeroLinks: React.FC<{
  className?: string
  links: Page['hero']['links'] | CallToActionBlock['links']
}> = ({
  className,
  links,
}) => {
  if (!Array.isArray(links) || links.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap gap-4', className)}>
      {links.map(({ link }, i) => (
        <li key={i}>
          <CMSLink
            {...link}
            appearance="default"
            size="lg"
            className={cn(
              'font-heading font-semibold',
              link.appearance !== 'outline'
                ? 'bg-brand-green text-[#241c52] hover:bg-brand-green/90'
                : 'bg-transparent border border-white/70 text-white hover:bg-white/10',
            )}
          />
        </li>
      ))}
    </ul>
  )
}
