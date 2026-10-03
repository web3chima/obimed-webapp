// How long an invoice stays valid for delivery after the PO is received
export const INVOICE_VALIDITY_DAYS = 7

// Not every customer gets credit: by default they pay before delivery
export type PaymentTerms = 'prepaid' | 'on-delivery' | 'credit'

export const paymentTermsOptions: { label: string; value: PaymentTerms }[] = [
  { label: 'Pay before delivery', value: 'prepaid' },
  { label: 'Pay on delivery', value: 'on-delivery' },
  { label: 'Credit (days after delivery)', value: 'credit' },
]

export const DEFAULT_CREDIT_DAYS = 15

type HasTerms = { paymentTerms?: PaymentTerms | null; creditDays?: number | null }

export const termsOf = (source?: HasTerms | null) => ({
  kind: (source?.paymentTerms ?? 'prepaid') as PaymentTerms,
  days: source?.creditDays ?? DEFAULT_CREDIT_DAYS,
})

// "Pay before delivery", "Pay on delivery", "15 days credit"
export const termsLabel = (source?: HasTerms | null) => {
  const { days, kind } = termsOf(source)
  if (kind === 'prepaid') return 'Pay before delivery'
  if (kind === 'on-delivery') return 'Pay on delivery'
  return `${days} days credit`
}

// When payment falls due, in words
export const dueInWords = (source?: HasTerms | null) => {
  const { days, kind } = termsOf(source)
  if (kind === 'prepaid') return `before delivery, within the invoice’s ${INVOICE_VALIDITY_DAYS}-day validity`
  if (kind === 'on-delivery') return 'on the day of delivery'
  return `${days} days after delivery`
}
