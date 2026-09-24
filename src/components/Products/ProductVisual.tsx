import React from 'react'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = {
  product: Pick<Product, 'title' | 'images' | 'category' | 'packaging' | 'grade'>
  className?: string
  priority?: boolean
  size?: 'card' | 'large'
}

// First uploaded image, or a drawn product bag until photos are added in the admin
export const ProductVisual: React.FC<Props> = ({ className, priority, product, size = 'card' }) => {
  const image = product.images?.find((img) => typeof img === 'object')

  if (image && typeof image === 'object') {
    return (
      <div className={cn('relative overflow-hidden bg-card', className)}>
        <Media fill imgClassName="object-contain p-4" priority={priority} resource={image} />
      </div>
    )
  }

  const band = product.category === 'food-grade' ? 'bg-brand-green' : 'bg-brand-purple'

  return (
    <div
      aria-hidden
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent to-card',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex flex-col overflow-hidden rounded-[0.6rem] bg-white shadow-lg ring-1 ring-black/5',
          'transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-105',
          size === 'large' ? 'h-[70%] w-[52%]' : 'h-[72%] w-[56%]',
        )}
      >
        {/* stitched top seam */}
        <div className="h-3 border-b-2 border-dashed border-black/10 bg-black/[0.03]" />
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-3 text-center">
          <span className="font-heading text-[0.6rem] font-bold uppercase tracking-[0.25em] text-brand-green-ink">
            Obimed
          </span>
          <span
            className={cn(
              'font-heading font-extrabold uppercase leading-tight text-[#2f2566]',
              size === 'large' ? 'text-lg md:text-2xl' : 'text-xs md:text-sm',
            )}
          >
            {product.title}
          </span>
          {product.grade && (
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#66666b]">
              {product.grade}
            </span>
          )}
        </div>
        <div className={cn('flex items-center justify-center py-2', band)}>
          <span
            className={cn(
              'text-[0.6rem] font-bold uppercase tracking-wider',
              product.category === 'food-grade' ? 'text-[#241c52]' : 'text-white',
            )}
          >
            {product.packaging || 'Net wt. 25 kg'}
          </span>
        </div>
      </div>
    </div>
  )
}
