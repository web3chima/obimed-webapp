import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import { siteConfig } from './siteConfig'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: siteConfig.description,
  images: [
    {
      url: `${getServerSideURL()}/brand/og-image.png`,
      width: 1200,
      height: 630,
    },
  ],
  siteName: siteConfig.name,
  title: siteConfig.name,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
