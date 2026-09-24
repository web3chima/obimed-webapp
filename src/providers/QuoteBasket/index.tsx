'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type BasketItem = {
  slug: string
  title: string
  packaging?: string | null
  quantity: string
}

type QuoteBasketContextType = {
  items: BasketItem[]
  has: (slug: string) => boolean
  add: (item: Omit<BasketItem, 'quantity'>) => void
  remove: (slug: string) => void
  toggle: (item: Omit<BasketItem, 'quantity'>) => void
  setQuantity: (slug: string, quantity: string) => void
  clear: () => void
}

const STORAGE_KEY = 'obimed-quote-basket'

const QuoteBasketContext = createContext<QuoteBasketContextType | null>(null)

export const QuoteBasketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<BasketItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // Storage can be unavailable (private mode); the basket then lasts for this visit only
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore: see above
    }
  }, [items, loaded])

  const has = useCallback((slug: string) => items.some((item) => item.slug === slug), [items])

  const add = useCallback((item: Omit<BasketItem, 'quantity'>) => {
    setItems((current) =>
      current.some((i) => i.slug === item.slug) ? current : [...current, { ...item, quantity: '' }],
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug))
  }, [])

  const toggle = useCallback(
    (item: Omit<BasketItem, 'quantity'>) => {
      if (has(item.slug)) remove(item.slug)
      else add(item)
    },
    [add, has, remove],
  )

  const setQuantity = useCallback((slug: string, quantity: string) => {
    setItems((current) =>
      current.map((item) => (item.slug === slug ? { ...item, quantity } : item)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({ items, has, add, remove, toggle, setQuantity, clear }),
    [items, has, add, remove, toggle, setQuantity, clear],
  )

  return <QuoteBasketContext.Provider value={value}>{children}</QuoteBasketContext.Provider>
}

export const useQuoteBasket = (): QuoteBasketContextType => {
  const context = useContext(QuoteBasketContext)
  if (!context) throw new Error('useQuoteBasket must be used within QuoteBasketProvider')
  return context
}
