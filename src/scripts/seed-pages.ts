// Creates or updates the Obimed Home and Company pages and the header/footer navigation, and
// creates the legal pages as unpublished drafts if they do not exist yet (they are never
// overwritten, so a lawyer-approved version is safe). Other content is left untouched.
// Run from the project root (with the dev server stopped, then start it again):
// bun src/scripts/seed-pages.ts
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'

import config from '@payload-config'
import { clearNextCache } from './clearNextCache'
import { obimedCompany } from '@/endpoints/seed/obimed-company'
import { obimedHome } from '@/endpoints/seed/obimed-home'
import { obimedLegalPages } from '@/endpoints/seed/obimed-legal'

const payload = await getPayload({ config })
const context = { disableRevalidate: true }

const upsertPage = async (data: RequiredDataFromCollectionSlug<'pages'>) => {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: data.slug } },
    limit: 1,
    pagination: false,
    draft: true,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data, context })
    payload.logger.info(`Updated page: ${data.title}`)
  } else {
    await payload.create({ collection: 'pages', data, context })
    payload.logger.info(`Created page: ${data.title}`)
  }
}

await upsertPage(obimedHome)
await upsertPage(obimedCompany)

for (const data of obimedLegalPages) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: data.slug } },
    limit: 1,
    pagination: false,
    draft: true,
  })

  if (existing.docs[0]) {
    payload.logger.info(`Skipped page (already exists): ${data.title}`)
  } else {
    await payload.create({ collection: 'pages', data, draft: true, context })
    payload.logger.info(`Created draft page: ${data.title}`)
  }
}

const navLink = (label: string, url: string) => ({
  link: { type: 'custom' as const, label, url, newTab: false },
})

await payload.updateGlobal({
  slug: 'header',
  data: {
    navItems: [
      navLink('Products', '/products'),
      navLink('Solutions', '/#solutions'),
      navLink('Company', '/company'),
    ],
  },
  context,
})

await payload.updateGlobal({
  slug: 'footer',
  data: {
    navItems: [
      navLink('Company', '/company'),
      navLink('Products', '/products'),
      navLink('Solutions', '/#solutions'),
      navLink('Careers', '/careers'),
      navLink('Request a quote', '/quote'),
    ],
  },
  context,
})

payload.logger.info('Updated header and footer navigation')
await clearNextCache()
process.exit(0)
