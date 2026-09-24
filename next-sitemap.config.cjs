// Ignore a localhost URL copied from a local .env when building on Vercel
const configuredURL =
  process.env.VERCEL && /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_SERVER_URL || '')
    ? undefined
    : process.env.NEXT_PUBLIC_SERVER_URL

const SITE_URL =
  configuredURL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://example.com')

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/posts-sitemap.xml', '/pages-sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [`${SITE_URL}/pages-sitemap.xml`, `${SITE_URL}/posts-sitemap.xml`],
  },
}
