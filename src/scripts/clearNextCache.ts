import { rm } from 'fs/promises'
import path from 'path'

// Seed scripts write to the database outside Next.js, so cached globals and pages are not
// revalidated. Clearing the fetch cache makes the site pick up the new content after a restart.
export const clearNextCache = async () => {
  for (const dir of ['.next/cache/fetch-cache', '.next/dev/cache/fetch-cache']) {
    await rm(path.resolve(process.cwd(), dir), { force: true, recursive: true })
  }
  console.log('Cleared the Next.js fetch cache. Restart the dev server to see the changes.')
}
