import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Jobs } from './collections/Jobs'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

// node-postgres treats sslmode=require as full certificate verification, which Supabase's pooler
// certificate fails; uselibpqcompat restores the usual "encrypt, don't verify" meaning
function withLibpqSSL(url: string | undefined) {
  if (!url || !/[?&]sslmode=require\b/.test(url) || /[?&]uselibpqcompat=/.test(url)) return url
  return `${url}&uselibpqcompat=true`
}

// The Vercel Supabase integration provides POSTGRES_URL (transaction pooler) instead of DATABASE_URL
const databaseURL = withLibpqSSL(process.env.DATABASE_URL || process.env.POSTGRES_URL)

// Fail early with a clear message instead of an opaque build error (e.g. on Vercel, where
// .env is not uploaded and these must be set under Settings → Environment Variables)
const missingEnv = [
  !process.env.PAYLOAD_SECRET && 'PAYLOAD_SECRET',
  !databaseURL && 'DATABASE_URL (or POSTGRES_URL)',
].filter(Boolean)
if (missingEnv.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnv.join(', ')}. Set them in .env locally, or in Vercel under Settings → Environment Variables (see .env.example).`,
  )
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' - Obimed Admin',
      icons: [{ rel: 'icon', type: 'image/png', url: '/brand/icon.png' }],
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
      // Supabase's session pooler allows 15 connections in total; each process (dev server,
      // build workers, seed scripts) opens its own pool, so keep them small
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
    },
  }),
  collections: [Pages, Products, Jobs, Posts, Media, Categories, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
