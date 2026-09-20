# Field / Notes

A personal research archive built around readable JSON, source-controlled media, and Git.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production validation is `npm run lint` and `npm run build`.

## Deploy on Netlify

Connect the repository to Netlify and use the default Node build environment. `netlify.toml` runs `npm run build` and enables the official Next.js adapter, so direct requests to locale research URLs such as `/uz/research/neural-networks` are handled by Next instead of falling through to a static 404. Legacy `/article/<slug>` and `/<locale>/article/<slug>` links redirect to the canonical research URL.

## Content workflow

- Published documents live under `content/` as deterministic JSON.
- `content/tree.json` is the hierarchy source of truth.
- The public site statically renders published JSON only.
- `/private-editor` imports an existing document, validates required identity fields, and exports JSON or a ZIP preserving the `content/<section>/<slug>.json` path.
- The editor intentionally downloads files. It cannot and does not pretend to modify the Git repository; review exports, replace source files, then commit and push.

## Editor protection

Set the server-only `EDITOR_PASSWORD_HASH` environment variable using a bcrypt hash. The private route and publish API use browser Basic Auth, fail closed when the hash is missing, send no-store/security headers, and throttle repeated failed attempts. The plaintext password is never stored in the repository, browser bundle, or Netlify logs.

Turbopack keeps a record of the environment variables each compilation read inside its incremental cache, so the hash shows up in `.next/cache` during a build. `netlify.toml` therefore omits the cache directories from Netlify secrets scanning; deployed output is still scanned in full.

## Automatic publishing

The private editor includes `Publish to GitHub`. Configure `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` in Netlify environment variables. The server commits the generated locale document and uploaded media through the GitHub Contents API; Netlify then rebuilds from that commit. The GitHub token is never exposed to browser code. ZIP export remains available as a manual fallback.

This project has no database, analytics store, reaction store, or server-side content API. Add any future external analytics or reaction provider behind an explicit adapter rather than fabricating counts.
