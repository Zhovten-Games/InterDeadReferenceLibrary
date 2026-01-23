# Quick reference (tokens, variables, touchpoints)

This is a condensed operator checklist. It intentionally lists **names only**, never secret values.

## Tokens to rotate (where)

- **NPM publish (CI)**: `NPM_TOKEN` in GitHub Secrets for the InterDeadCore release workflows.
- **Cloudflare deploy (Worker/Pages)**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets for the Worker workflow.
- **Cloudflare runtime secrets** (set in the Worker configuration, not in GitHub):
  - `IDENTITY_DISCORD_CLIENT_ID`
  - `IDENTITY_DISCORD_CLIENT_SECRET`
  - `IDENTITY_DISCORD_REDIRECT_URI`
  - `IDENTITY_JWT_SECRET`
  - `EFBD_API_BASE` (optional)

## Bindings and storage

- **D1 binding**: `INTERDEAD_CORE`
- **KV binding**: `IDENTITY_KV`

## Update interactions (fast path)

1. Publish new InterDeadCore packages to npm.
2. Update InterDeadIT dependencies to the new package versions.
3. Deploy the Worker with Wrangler if its code or bindings changed.
4. Deploy the Hugo site to Cloudflare Pages.

## Mini-game requirement

- Provide `strings.profileLink` when initializing the EFBD poll to render the mini-profile link.
