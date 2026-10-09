# Field / Notes

A personal research archive with Google Drive as the content store and GitHub as the deploy mirror.

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
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REFRESH_TOKEN=
   GOOGLE_DRIVE_FOLDER_ID=
   ```

   `EDITOR_PASSWORD_HASH` is a bcrypt hash, not the plaintext editor password. Generate one locally with:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('replace-with-a-long-password', 12))"
   ```

   `GITHUB_TOKEN` needs repository contents read/write permission. It is server-only and is never exposed to the browser.
5. Deploy, then verify `/en`, `/uz`, `/ru`, and `/private-editor`.
6. Add the production domain in **Settings → Domains** if using a custom domain.

The build generates `src/lib/generated-content.ts` from the JSON files mirrored into the repository after a Google Drive save.

## Environment variables

| Variable | Required | Runtime | Purpose |
| --- | --- | --- | --- |
| `EDITOR_PASSWORD_HASH` | Yes for the editor | Server | Bcrypt hash used by Basic Auth |
| `GITHUB_TOKEN` | Only for GitHub publishing | Server | Contents API token used by `/api/admin/publish` |
| `GITHUB_OWNER` | Only for GitHub publishing | Server | Repository owner |
| `GITHUB_REPO` | Only for GitHub publishing | Server | Repository name |
| `GITHUB_BRANCH` | No; defaults to `master` | Server | Branch receiving editor commits |
| `GOOGLE_CLIENT_ID` | Yes for content storage | Server | OAuth client ID for Drive API |
| `GOOGLE_CLIENT_SECRET` | Yes for content storage | Server | OAuth client secret for Drive API |
| `GOOGLE_REFRESH_TOKEN` | Yes for content storage | Server | Drive refresh token |
| `GOOGLE_DRIVE_FOLDER_ID` | Yes for content storage | Server | Drive folder containing content files |

There are no required `NEXT_PUBLIC_*` variables.

## Deploy on Netlify

Connect the repository to Netlify and use the default Node build environment. `netlify.toml` runs `npm run build` and enables the official Next.js adapter, so direct requests to locale research URLs such as `/uz/research/neural-networks` are handled by Next instead of falling through to a static 404. Legacy `/article/<slug>` and `/<locale>/article/<slug>` links redirect to the canonical research URL.

## Content workflow

- Google Drive is the editor's source of truth; files are mirrored under `content/` only so the public Next.js build can render them.
- `content/tree.json` is the hierarchy source of truth.
- The tree is language-independent: section IDs, document IDs, nesting, and ordering live only in `content/tree.json`; locale files provide translated document text and labels, not separate structures.
- The public site statically renders published JSON only.
- `/private-editor` imports an existing document, validates required identity fields, and exports JSON or a ZIP preserving the `content/locales/<locale>/<slug>.json` path.
- The editor reads documents from the protected Google Drive storage API and creates, updates, and deletes Drive files through the protected publish API; GitHub is updated only after Drive succeeds.

## Editor protection

Set the server-only `EDITOR_PASSWORD_HASH` environment variable using a bcrypt hash. The private route and publish API use browser Basic Auth, fail closed when the hash is missing, send no-store/security headers, and throttle repeated failed attempts. The plaintext password is never stored in the repository, browser bundle, or Netlify logs.

Turbopack keeps a record of the environment variables each compilation read inside its incremental cache, so the hash shows up in `.next/cache` during a build. `netlify.toml` therefore omits the cache directories from Netlify secrets scanning; deployed output is still scanned in full.

## Automatic publishing

The private editor includes `Save to Google Drive`. Configure both the Google Drive and GitHub variables in Netlify. The server updates or deletes Drive files first, then mirrors the same files through the GitHub Contents API so Netlify can rebuild. Neither token is exposed to browser code. ZIP export remains available as a manual fallback.

The protected `/api/admin/storage` endpoint reads the current Drive content for the editor. Drive is a document store rather than a relational database, so concurrent writes should remain single-admin operations.
