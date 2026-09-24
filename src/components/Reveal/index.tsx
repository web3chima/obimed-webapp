'use client'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  as?: 'div' | 'li'
  children: React.ReactNode
  className?: string
  delay?: number
}

// Fades and lifts its children into view the first time they scroll on screen
export const Reveal: React.FC<Props> = ({ as: Tag = 'div', children, className, delay = 0 }) => {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return React.createElement(
    Tag,
    {
      className: cn(
        'reveal transition-all duration-700 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      ),
      ref,
      style: { transitionDelay: visible ? `${delay}ms` : undefined },
    },
    children,
  )
}
