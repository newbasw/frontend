# BAS World — storefront

The public site: catalogue, search and filtering, vehicle pages, auctions with
the negotiation bot, checkout, instalment plans, and buyer chat.

Next.js App Router, deployed on Vercel.

## Running locally

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the API
npm run build
npm start                    # listens on :3000
```

The API must be running for anything data-driven to work.

## Notes

- A Vercel cron calls `/api/cron/sync` once a day (03:00 UTC), which asks the
  API to pull newly posted vehicles. It needs `CRON_SECRET` to match the API's.

  Once a day is the ceiling on Vercel's Hobby plan — anything more frequent is
  rejected at deploy time. If you want the catalogue to refresh more often,
  either upgrade to Pro, or add a Render cron job hitting the API's
  `POST /api/sync/run` directly with the same secret. The API is the thing
  doing the work either way; this route only triggers it.

- Admins can also press **Sync now** in the console at any time, so the
  schedule is a backstop rather than the only way new vehicles arrive.
- `NEXT_PUBLIC_API_URL` must be an origin the API allows in `CORS_ORIGIN`.
  Getting this wrong produces a site that loads and then does nothing.
