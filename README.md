# Field / Notes

A personal research archive built around readable JSON, source-controlled media, and Git.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production validation is `npm run lint` and `npm run build`.

## Deploy on Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project**, import `Otabek-1/AI-research-diary`, and keep the detected framework as **Next.js**.
3. Leave the build command as `npm run build`; no output directory override is required.
4. Add these environment variables for Preview and Production:

   ```text
   EDITOR_PASSWORD_HASH=
   GITHUB_TOKEN=
   GITHUB_OWNER=Otabek-1
   GITHUB_REPO=AI-research-diary
   GITHUB_BRANCH=master
   ```

   `EDITOR_PASSWORD_HASH` is a bcrypt hash, not the plaintext editor password. Generate one locally with:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('replace-with-a-long-password', 12))"
   ```

   `GITHUB_TOKEN` needs repository contents read/write permission. It is server-only and is never exposed to the browser.
5. Deploy, then verify `/en`, `/uz`, `/ru`, `/en/research/where-it-begins`, and `/private-editor`.
6. Add the production domain in **Settings → Domains** if using a custom domain.

The build generates `src/lib/generated-content.ts` from the JSON files in `content/locales/`, so newly published research is bundled automatically on the next Vercel build.

## Environment variables

| Variable | Required | Runtime | Purpose |
| --- | --- | --- | --- |
| `EDITOR_PASSWORD_HASH` | Yes for the editor | Server | Bcrypt hash used by Basic Auth |
| `GITHUB_TOKEN` | Only for GitHub publishing | Server | Contents API token used by `/api/admin/publish` |
| `GITHUB_OWNER` | Only for GitHub publishing | Server | Repository owner |
| `GITHUB_REPO` | Only for GitHub publishing | Server | Repository name |
| `GITHUB_BRANCH` | No; defaults to `master` | Server | Branch receiving editor commits |

There are no required `NEXT_PUBLIC_*` variables.

## Deploy on Netlify

Connect the repository to Netlify and use the default Node build environment. `netlify.toml` runs `npm run build` and enables the official Next.js adapter, so direct requests to locale research URLs such as `/uz/research/neural-networks` are handled by Next instead of falling through to a static 404. Legacy `/article/<slug>` and `/<locale>/article/<slug>` links redirect to the canonical research URL.

## Content workflow

- Published documents live under `content/` as deterministic JSON.
- `content/tree.json` is the hierarchy source of truth.
- The tree is language-independent: section IDs, document IDs, nesting, and ordering live only in `content/tree.json`; locale files provide translated document text and labels, not separate structures.
- The public site statically renders published JSON only.
- `/private-editor` imports an existing document, validates required identity fields, and exports JSON or a ZIP preserving the `content/locales/<locale>/<slug>.json` path.
- The editor can queue changes locally and publish them through the protected GitHub Contents API; ZIP export remains available as a manual fallback.

## Editor protection

Set the server-only `EDITOR_PASSWORD_HASH` environment variable using a bcrypt hash. The private route and publish API use browser Basic Auth, fail closed when the hash is missing, send no-store/security headers, and throttle repeated failed attempts. The plaintext password is never stored in the repository, browser bundle, or Netlify logs.

Turbopack keeps a record of the environment variables each compilation read inside its incremental cache, so the hash shows up in `.next/cache` during a build. `netlify.toml` therefore omits the cache directories from Netlify secrets scanning; deployed output is still scanned in full.

## Automatic publishing

The private editor includes `Publish to GitHub`. Configure `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` in Netlify environment variables. The server updates or deletes generated files through the GitHub Contents API, including the shared `content/tree.json`; Netlify then rebuilds from those commits. The GitHub token is never exposed to browser code. ZIP export remains available as a manual fallback.

This project has no database, analytics store, reaction store, or server-side content API. Add any future external analytics or reaction provider behind an explicit adapter rather than fabricating counts.
