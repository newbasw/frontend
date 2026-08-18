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

- A Vercel cron calls `/api/cron/sync` every six hours, which asks the API to
  pull newly posted vehicles. It needs `CRON_SECRET` to match the API's.
- `NEXT_PUBLIC_API_URL` must be an origin the API allows in `CORS_ORIGIN`.
  Getting this wrong produces a site that loads and then does nothing.
