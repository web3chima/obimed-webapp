import React from 'react'

import type { LogoStripBlock as LogoStripBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'

// Each half of the track needs enough entries to span wide screens
const MIN_ITEMS_PER_HALF = 8

export const LogoStripBlock: React.FC<LogoStripBlockProps> = ({ caption, heading, items }) => {
  if (!items?.length) return null

  const repeat = Math.max(1, Math.ceil(MIN_ITEMS_PER_HALF / items.length))
  const half = Array.from({ length: repeat }, () => items).flat()

  return (
    <section className="logo-strip group py-12 border-b border-border">
      <div className="container flex flex-col items-center text-center">
        {heading && (
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green-ink">
            {heading}
          </h2>
        )}
        {/* Screen readers get the plain list; the moving track is decorative */}
        <ul className="sr-only">
          {items.map((item, i) => (
            <li key={item.id || i}>{item.name}</li>
          ))}
        </ul>
      </div>

      <div
        aria-hidden
        className="marquee relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <div className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <div className="flex shrink-0 items-center" key={copy}>
              {half.map((item, i) => (
                <div className="mx-8 md:mx-12 flex h-14 items-center" key={`${copy}-${i}`}>
                  {item.logo && typeof item.logo === 'object' ? (
                    <Media
                      imgClassName="h-12 w-auto object-contain grayscale opacity-70 transition group-hover:grayscale-0 group-hover:opacity-100"
                      resource={item.logo}
                    />
                  ) : (
                    <span className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wide text-heading/60 transition-colors group-hover:text-primary whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {caption && (
        <p className="container mt-6 max-w-2xl text-center text-sm leading-relaxed transition-opacity duration-300 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          {caption}
        </p>
      )}
    </section>
  )
}
