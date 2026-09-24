import canUseDOM from './canUseDOM'

// A localhost URL copied from a local .env must not leak into a Vercel deployment
const configuredServerURL = () => {
  const url = process.env.NEXT_PUBLIC_SERVER_URL
  if (url && process.env.VERCEL && /localhost|127\.0\.0\.1/.test(url)) return undefined
  return url
}

export const getServerSideURL = () => {
  return (
    configuredServerURL() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return configuredServerURL() || ''
}
