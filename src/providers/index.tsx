import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { QuoteBasketProvider } from './QuoteBasket'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <QuoteBasketProvider>{children}</QuoteBasketProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
