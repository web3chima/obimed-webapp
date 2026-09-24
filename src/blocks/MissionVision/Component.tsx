import React from 'react'
import { EyeIcon, TargetIcon } from 'lucide-react'

import type { MissionVisionBlock as MissionVisionBlockProps } from '@/payload-types'

import { Reveal } from '@/components/Reveal'
import { cn } from '@/utilities/ui'

export const MissionVisionBlock: React.FC<MissionVisionBlockProps> = ({ mission, vision }) => {
  const cards = [
    { icon: TargetIcon, label: 'Mission', text: mission, tone: 'purple' as const },
    { icon: EyeIcon, label: 'Vision', text: vision, tone: 'green' as const },
  ]

  return (
    <section className="pb-20 md:pb-28">
      <div className="container grid gap-6 md:grid-cols-2">
        {cards.map(({ icon: Icon, label, text, tone }, i) => (
          <Reveal delay={i * 150} key={label}>
            <div
              className={cn(
                'group relative h-full overflow-hidden rounded-2xl p-8 md:p-10 transition-transform duration-300 hover:-translate-y-1',
                tone === 'purple'
                  ? 'bg-brand-purple-dark text-white'
                  : 'bg-brand-green text-[#241c52]',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'absolute -right-6 -top-6 h-40 w-40 transition-transform duration-700 group-hover:rotate-12',
                  tone === 'purple' ? 'text-white/10' : 'text-[#241c52]/10',
                )}
              />
              <span
                className={cn(
                  'relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl',
                  tone === 'purple' ? 'bg-brand-green text-[#241c52]' : 'bg-[#241c52] text-white',
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <h2
                className={cn(
                  'relative font-heading text-sm font-bold uppercase tracking-[0.2em]',
                  tone === 'purple' ? 'text-brand-green' : 'text-[#241c52]',
                )}
              >
                {label}
              </h2>
              <p
                className={cn(
                  'relative mt-3 font-heading text-xl md:text-2xl font-semibold leading-snug',
                  tone === 'purple' ? 'text-white' : 'text-[#241c52]',
                )}
              >
                {text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
