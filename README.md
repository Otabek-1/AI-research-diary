# Field / Notes

A personal research archive built around readable JSON, source-controlled media, and Git.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production validation is `npm run lint` and `npm run build`.

## Content workflow

- Published documents live under `content/` as deterministic JSON.
- `content/tree.json` is the hierarchy source of truth.
- The public site statically renders published JSON only.
- `/private-editor` imports an existing document, validates required identity fields, and exports JSON or a ZIP preserving the `content/<section>/<slug>.json` path.
- The editor intentionally downloads files. It cannot and does not pretend to modify the Git repository; review exports, replace source files, then commit and push.

## Editor protection

Set the server-only `EDITOR_PASSWORD` environment variable using the shape in `.env.example`. The private route is protected by Basic Auth middleware when the variable is configured. Without it, local development leaves the route open so the export workflow can be tested.

This project has no database, analytics store, reaction store, or server-side content API. Add any future external analytics or reaction provider behind an explicit adapter rather than fabricating counts.
