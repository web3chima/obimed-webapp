'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

const AUTO_ADVANCE_MS = 5000

// Full-size product photos that slide from one to the next: automatically every few seconds
// (paused while hovered or after the visitor takes over), by arrows, swipe or thumbnails
export const ProductGallery: React.FC<{ images: MediaType[]; title: string }> = ({
  images,
  title,
}) => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [userControlled, setUserControlled] = useState(false)
  const touchStart = useRef<number | null>(null)
  const count = images.length

  const go = useCallback((next: number) => setIndex((next + count) % count), [count])
  const choose = (next: number) => {
    setUserControlled(true)
    go(next)
  }

  useEffect(() => {
    if (count < 2 || paused || userControlled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => go(index + 1), AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [count, go, index, paused, userControlled])

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-label={`${title} photos`}
        aria-roledescription="carousel"
        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') choose(index + 1)
          if (e.key === 'ArrowLeft') choose(index - 1)
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return
          const moved = e.changedTouches[0]!.clientX - touchStart.current
          if (Math.abs(moved) > 40) choose(moved < 0 ? index + 1 : index - 1)
          touchStart.current = null
        }}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]!.clientX
        }}
        role="region"
        tabIndex={0}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((image, i) => (
            <div
              aria-hidden={i !== index}
              aria-label={`Photo ${i + 1} of ${count}`}
              aria-roledescription="slide"
              className="relative h-full w-full shrink-0"
              key={image.id}
              role="group"
            >
              <Media
                fill
                imgClassName="object-contain p-4"
                priority={i === 0}
                resource={image}
                size="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#2f2566] shadow-md transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              onClick={() => choose(index - 1)}
              type="button"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#2f2566] shadow-md transition-opacity hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              onClick={() => choose(index + 1)}
              type="button"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, i) => (
                <button
                  aria-current={i === index}
                  aria-label={`Show photo ${i + 1}`}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-6 bg-brand-purple' : 'w-2 bg-brand-purple/30',
                  )}
                  key={image.id}
                  onClick={() => choose(i)}
                  type="button"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, i) => (
            <button
              aria-label={`Show photo ${i + 1}`}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border-2 bg-card transition-colors',
                i === index ? 'border-brand-purple' : 'border-border hover:border-brand-purple/50',
              )}
              key={image.id}
              onClick={() => choose(i)}
              type="button"
            >
              <Media fill imgClassName="object-contain p-1.5" resource={image} size="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
