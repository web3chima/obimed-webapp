# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel (team web3chimas-projects, project obimed-webapp, GitHub-connected: web3chima/obimed-webapp)
- Production URL: https://obimed-webapp-web3chimas-projects.vercel.app
- Deploy workflow: auto-deploy on push to main (direct pushes, no pull requests)
- Deploy status command: `bun --bun ~/.bun/bin/vercel ls obimed-webapp --scope web3chimas-projects` (Vercel CLI 60 via Bun; no Node on this Mac), logs via `vercel inspect <url> --logs`
- Merge method: none (direct push to main)
- Project type: web app (Payload CMS + Next.js)
- Post-deploy health check: https://obimed-webapp-web3chimas-projects.vercel.app/ and https://obimed-webapp-web3chimas-projects.vercel.app/products return 200

### Custom deploy hooks
- Pre-merge: `bunx tsc --noEmit` (and `bunx next build` for larger changes)
- Deploy trigger: automatic on push to main
- Deploy status: poll production URL
- Health check: https://obimed-webapp-web3chimas-projects.vercel.app/
