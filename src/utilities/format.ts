const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
})

export const formatNaira = (amount: number | null | undefined) =>
  typeof amount === 'number' ? naira.format(amount) : '—'

export const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Africa/Lagos',
      })
    : '—'
