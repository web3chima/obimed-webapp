'use client'
import type { Order } from '@/payload-types'

import { useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

type Item = NonNullable<Order['items']>[number]

const titles = new Map<number, string>()

// "Sodium Bicarbonate — 10 bags" instead of "Item 01"
export const ItemRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<Item>()
  const product = data?.product
  const id = typeof product === 'object' ? product?.id : product
  const [title, setTitle] = useState<string | undefined>(
    typeof product === 'object' ? product?.title : id ? titles.get(id) : undefined,
  )

  useEffect(() => {
    if (!id || title) return
    let cancelled = false
    fetch(`/api/products/${id}?depth=0&select[title]=true`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => {
        if (doc?.title && !cancelled) {
          titles.set(id, doc.title)
          setTitle(doc.title)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id, title])

  const name = title || `Item ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  const quantity = data?.quantity ? ` — ${data.quantity} bags` : ''
  const priced = typeof data?.unitPrice === 'number' ? '' : ' · needs price'
  return <span>{`${name}${quantity}${priced}`}</span>
}
