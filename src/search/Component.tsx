'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SearchIcon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'

const searchURL = (value: string) =>
  `/search${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''}`

export const Search: React.FC<{ initialValue?: string }> = ({ initialValue = '' }) => {
  const [value, setValue] = useState(initialValue)
  const router = useRouter()

  const debouncedValue = useDebounce(value, 400)

  // Results update while typing; Enter or the button searches straight away
  useEffect(() => {
    if (debouncedValue.trim() !== initialValue.trim()) router.replace(searchURL(debouncedValue))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        router.replace(searchURL(value))
      }}
      role="search"
    >
      <Label htmlFor="search" className="sr-only">
        Search products
      </Label>
      <Input
        autoFocus
        className="h-12 text-base"
        id="search"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products, e.g. starch, sodium, CAS number"
        type="search"
        value={value}
      />
      <Button className="h-12 shrink-0 px-5" type="submit">
        <SearchIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  )
}
