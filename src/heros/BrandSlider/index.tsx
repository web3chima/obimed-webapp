'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useState } from 'react'
import { FlaskConicalIcon, PackageIcon, ShieldCheckIcon, WheatIcon } from 'lucide-react'

import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { BrandHeroLinks } from '@/heros/BrandHeroLinks'
import { cn } from '@/utilities/ui'

const SLIDE_INTERVAL_MS = 5000

export const BrandSliderHero: React.FC<Page['hero']> = ({
  brandMedia,
  links,
  richText,
  slides,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const slideCount = slides?.length || 0

  useEffect(() => {
    setHeaderTheme('dark')
  })

  useEffect(() => {
    if (slideCount < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slideCount)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [slideCount, paused])

  return (
    <section
      className="relative -mt-[9rem] md:-mt-[10rem] overflow-hidden bg-brand-purple text-white"
      data-theme="dark"
    >
      {/* Diagonal brand shapes, echoing the brochure */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[70%] bg-brand-green/90 [clip-path:polygon(55%_100%,100%_25%,100%_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[70%] bg-white/5 [clip-path:polygon(20%_100%,100%_0,100%_18%,38%_100%)]"
      />

      <div className="container relative pt-[9rem] md:pt-[10rem] pb-20 md:pb-28 grid gap-12 lg:grid-cols-[1.15fr_1fr] items-center">
        <div>
          {richText && (
            <RichText
              className="mb-6 prose-h1:font-bold prose-h1:leading-tight prose-h1:text-[2.25rem] md:prose-h1:text-[3.25rem] prose-p:text-white/85 prose-p:text-lg"
              data={richText}
              enableGutter={false}
            />
          )}

          {slideCount > 0 && (
            <div
              className="mb-10"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="relative min-h-[5.5rem] md:min-h-[4.5rem] border-l-4 border-brand-green pl-5">
                {slides?.map((slide, i) => (
                  <p
                    aria-hidden={i !== active}
                    className={cn(
                      'absolute inset-0 pl-5 text-lg md:text-xl font-heading font-medium text-white transition-all duration-700',
                      i === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                    )}
                    key={slide.id || i}
                  >
                    {slide.text}
                  </p>
                ))}
              </div>
              {slideCount > 1 && (
                <div className="mt-4 flex gap-2" role="tablist" aria-label="Hero messages">
                  {slides?.map((slide, i) => (
                    <button
                      aria-label={`Show message ${i + 1}`}
                      aria-selected={i === active}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === active ? 'w-8 bg-brand-green' : 'w-4 bg-white/40 hover:bg-white/70',
                      )}
                      key={slide.id || i}
                      onClick={() => setActive(i)}
                      role="tab"
                      type="button"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <BrandHeroLinks links={links} />
        </div>

        <div className="relative">
          {brandMedia && typeof brandMedia === 'object' ? (
            <Media
              imgClassName="w-full h-auto rounded-2xl shadow-2xl"
              priority
              resource={brandMedia}
            />
          ) : (
            <BrandGraphic />
          )}
        </div>
      </div>
    </section>
  )
}

const categories = [
  { icon: FlaskConicalIcon, title: 'Active Pharmaceutical Ingredients', note: 'Coming soon' },
  { icon: PackageIcon, title: 'Excipients', note: 'Sodium bicarbonate, dextrose, xanthan gum…' },
  { icon: WheatIcon, title: 'Food-grade raw materials', note: 'MSG, citric acid, corn starch…' },
  { icon: ShieldCheckIcon, title: 'QA checklist on every delivery', note: 'COA-backed supply' },
]

const BrandGraphic: React.FC = () => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
    {categories.map(({ icon: Icon, note, title }, i) => (
      <div
        className={cn(
          'rounded-xl bg-white text-brand-charcoal p-5 shadow-xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-fill-mode:both]',
        )}
        key={title}
        style={{ animationDelay: `${i * 120}ms` }}
      >
        <Icon className="w-7 h-7 text-brand-purple mb-3" />
        <p className="font-heading font-bold text-[#2f2566] leading-snug">{title}</p>
        <p className="text-sm text-[#66666b] mt-1">{note}</p>
      </div>
    ))}
  </div>
)
