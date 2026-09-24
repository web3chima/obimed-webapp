'use client'
import React from 'react'
import { CheckIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuoteBasket } from '@/providers/QuoteBasket'
import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  disabled?: boolean
  packaging?: string | null
  size?: 'default' | 'lg' | 'sm'
  slug: string
  title: string
}

export const AddToQuoteButton: React.FC<Props> = ({
  className,
  disabled,
  packaging,
  size = 'default',
  slug,
  title,
}) => {
  const { has, toggle } = useQuoteBasket()
  const added = has(slug)

  if (disabled) {
    return (
      <Button className={className} disabled size={size} variant="outline">
        Coming soon
      </Button>
    )
  }

  return (
    <Button
      aria-pressed={added}
      className={cn('font-heading font-semibold', className)}
      onClick={() => toggle({ slug, title, packaging })}
      size={size}
      variant={added ? 'secondary' : 'default'}
    >
      {added ? <CheckIcon /> : <PlusIcon />}
      {added ? 'Added to quote' : 'Add to quote'}
    </Button>
  )
}
