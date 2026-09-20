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

Set the server-only `EDITOR_PASSWORD` environment variable using the shape in `.env.example`. The private route is protected by Basic Auth middleware when the variable is configured. Without it, local development leaves the route open so the export workflow can be tested.

## Automatic publishing

The private editor includes `Publish to GitHub`. Configure `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` in Netlify environment variables. The server commits the generated locale document and uploaded media through the GitHub Contents API; Netlify then rebuilds from that commit. The GitHub token is never exposed to browser code. ZIP export remains available as a manual fallback.

This project has no database, analytics store, reaction store, or server-side content API. Add any future external analytics or reaction provider behind an explicit adapter rather than fabricating counts.
