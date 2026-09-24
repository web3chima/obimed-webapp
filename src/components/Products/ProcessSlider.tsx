'use client'
import React, { useEffect, useState } from 'react'
import { ClipboardCheckIcon, FileTextIcon, PencilRulerIcon } from 'lucide-react'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'

const steps = [
  {
    icon: FileTextIcon,
    title: 'Project Plan',
    text: 'Our engagement begins with a detailed Local Purchase Order (LPO).',
  },
  {
    icon: PencilRulerIcon,
    title: 'Requirement Design',
    text: 'We capture your requirement expectations and scope the work to meet them.',
  },
  {
    icon: ClipboardCheckIcon,
    title: 'Implementation Plan',
    text: 'We supply your raw materials and sign off a QA checklist for every delivered item.',
  },
]

const STEP_INTERVAL_MS = 4500

// "Define our Process" hero for the products page
export const ProcessSlider: React.FC = () => {
  const { setHeaderTheme } = useHeaderTheme()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setHeaderTheme('dark')
  })

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % steps.length), STEP_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <section
      className="relative -mt-[9rem] md:-mt-[10rem] overflow-hidden bg-brand-purple text-white"
      data-theme="dark"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-[60%] bg-brand-green/90 [clip-path:polygon(70%_100%,100%_40%,100%_100%)]"
      />
      <div className="container relative pt-[9rem] md:pt-[10rem] pb-16 md:pb-20">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-green mb-3">
          Products
        </p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
          Raw materials for pharmaceutical and food manufacturing
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/85">
          Pick the products you need and add them to a quote. Here is how we deliver:
        </p>

        <ol
          className="mt-10 grid gap-4 md:grid-cols-3"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {steps.map(({ icon: Icon, text, title }, i) => {
            const isActive = i === active
            return (
              <li key={title}>
                <button
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'relative h-full w-full overflow-hidden rounded-xl p-5 text-left transition-all duration-500',
                    isActive
                      ? 'bg-white text-brand-charcoal shadow-2xl md:-translate-y-1'
                      : 'bg-white/10 text-white hover:bg-white/15',
                  )}
                  onClick={() => setActive(i)}
                  type="button"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-brand-green text-[#241c52]' : 'bg-white/10',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        'font-heading text-xs font-bold uppercase tracking-wider',
                        isActive ? 'text-brand-green-ink' : 'text-white/60',
                      )}
                    >
                      Step {i + 1}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'block font-heading text-lg font-bold',
                      isActive ? 'text-[#2f2566]' : 'text-white',
                    )}
                  >
                    {title}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-sm leading-relaxed',
                      isActive ? 'text-[#4b4b4d]' : 'text-white/75',
                    )}
                  >
                    {text}
                  </span>
                  {/* progress line for the active step */}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute bottom-0 left-0 h-1 bg-brand-green',
                      isActive && !paused ? 'animate-[step-progress_4.5s_linear]' : 'w-0',
                      isActive && paused && 'w-full',
                    )}
                    key={isActive ? `active-${active}` : 'idle'}
                  />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
