# Gubate

Website for the paintings of Gülçin Balta Tezcan.

- `web/`: the site and the admin panel (React + Vite). Admin lives at `/#/yonetim`.
- `api/`: the API (Hono). Stores one JSON document and the images.
- `vercel.json`: deploys both as one Vercel project (Vercel Services).

## Run locally

Needs Node 22.9 or newer and pnpm.

```sh
cp api/.env.example api/.env   # then fill in ADMIN_PASSWORD and SESSION_SECRET
pnpm run deps                  # installs api/ and web/ dependencies
pnpm run dev                   # api on :3001, site on :5173
```

Locally the data is written to `api/.data/` (ignored by git). Until the first save from the
admin panel, the site shows the seed data in `api/src/seed.ts`.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Storage > Create > Blob, access **Public**, and connect it to the project.
3. Set `ADMIN_PASSWORD` (8+ characters) and `SESSION_SECRET` (32+ random characters) in the
   project's environment variables.
4. Deploy.

With a Blob store connected, the API keeps the site document and the images there. Nothing else is
stored anywhere, so a backup is a copy of that store.

Every save writes the document twice: to `data/site.json`, which visitors read, and to a new file
under `data/versions/`. The admin panel reads the newest version file, because a file overwritten in
place can be served stale for up to a minute. The last 10 versions are kept and double as backups.

## Data model

`api/src/types.ts` defines the document. `web/src/types.ts` is a copy: change both together.

Each painting carries three colours (`palette`: ground, accent 1, accent 2). They drive the ink-wash
background and are suggested automatically at upload (`web/src/ink/palette.ts`), then editable.
