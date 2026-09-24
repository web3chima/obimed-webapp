// Icon choices offered in the admin for block items (kept free of React so configs can import it)
export const brandIconOptions = [
  { label: 'Award', value: 'award' },
  { label: 'Eye', value: 'eye' },
  { label: 'Factory', value: 'factory' },
  { label: 'Flask', value: 'flask' },
  { label: 'Gauge', value: 'gauge' },
  { label: 'Globe', value: 'globe' },
  { label: 'Handshake', value: 'handshake' },
  { label: 'Scale', value: 'scale' },
  { label: 'Shield', value: 'shield' },
  { label: 'Target', value: 'target' },
  { label: 'Truck', value: 'truck' },
  { label: 'Wallet', value: 'wallet' },
]

export type BrandIconName = (typeof brandIconOptions)[number]['value']
