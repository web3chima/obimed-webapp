import clsx from 'clsx'
import React from 'react'

import { siteConfig } from '@/utilities/siteConfig'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  /**
   * `color` for light backgrounds, `white` for purple/dark backgrounds,
   * `auto` switches with the active theme.
   */
  variant?: 'auto' | 'color' | 'white'
}

const sources = {
  color: '/brand/obimed-logo.png',
  white: '/brand/obimed-logo-white.png',
}

export const Logo = (props: Props) => {
  const {
    loading: loadingFromProps,
    priority: priorityFromProps,
    className,
    variant = 'auto',
  } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  const renderImg = (src: string, extraClassName?: string) => (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt={siteConfig.name}
      width={769}
      height={230}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('h-10 w-auto', extraClassName, className)}
      src={src}
    />
  )

  if (variant !== 'auto') return renderImg(sources[variant])

  return (
    <>
      {renderImg(sources.color, 'dark:hidden')}
      {renderImg(sources.white, 'hidden dark:block')}
    </>
  )
}
