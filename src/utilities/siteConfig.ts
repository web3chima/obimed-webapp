// Company details shared by the header, footer and metadata.
export const siteConfig = {
  name: 'Obimed Pharmaceutical Ltd.',
  shortName: 'Obimed',
  rcNumber: '7597788',
  tagline: 'Local market-ready access to raw material APIs and excipients',
  description:
    'Obimed Pharmaceutical Ltd. imports, distributes and markets Active Pharmaceutical Ingredients (APIs), excipients and food-grade raw materials for pharmaceutical and food manufacturers in Nigeria.',
  email: 'obimedpharmaceuticals@gmail.com',
  phones: ['+2349020755721', '+2348027348067', '+2348114299580', '+2348138582199'],
  whatsapp: '2349020755721',
  address: '208/210 Oshodi Apapa Expressway, Ilasamaja, Lagos, Nigeria',
}

// +2349020755721 -> 0902 075 5721
export const formatPhone = (phone: string) => {
  const local = phone.replace(/^\+234/, '0')
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}
