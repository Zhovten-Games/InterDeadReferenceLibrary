# Deployment standards (InterDead)

This folder consolidates deployment notes for the InterDead ecosystem. It is a neutral reference that describes the release paths for each repository without exposing secret values.

## InterDeadCore (packages)

InterDeadCore ships as npm packages and is deployed via release + publish, not by hosting a service directly.

- Update package versions with `npm version` inside each package directory.
- Build and test locally before publishing.
- Tag releases with package-qualified tags (for example `efbd-scale-v0.1.3`).
- Publish to npm so downstream repositories can update dependencies.

## InterDeadIT (site + Worker)

InterDeadIT is a static Hugo site deployed to Cloudflare Pages, plus a Cloudflare Worker that handles Discord OAuth and EFBD trigger ingestion.

- Hugo generates the static site from `content/`, `themes/InterDead/`, and `config/_default/`.
- The Worker lives in `workers/interdead-auth/` and deploys via Wrangler.
- The frontend reads the Worker base URL from Hugo params and exposes it via `window.__INTERDEAD_CONFIG__`.

## InterDeadCore ↔ InterDeadIT interaction

- InterDeadIT installs `@interdead/identity-core` and `@interdead/efbd-scale` as dependencies.
- The `interdead-auth` Worker uses these packages to issue sessions and to write EFBD scale updates to D1.
- Downstream updates are explicit: update the dependency versions after publishing a new core package.

## Secret handling (no values)

- CI publish tokens live in GitHub Secrets (for example `NPM_TOKEN`).
- Worker runtime secrets live in Cloudflare (Discord OAuth credentials, signing secrets, D1/KV bindings).
- Never ship secrets in the Hugo bundle; keep them in the Worker configuration.

## Wrangler deploy command

Run deployments from the Worker directory:

```bash
npx wrangler deploy --config wrangler.toml
```
