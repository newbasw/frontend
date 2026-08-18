import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scheduled catalogue refresh.
 *
 * Vercel Cron calls this on a schedule; it forwards to the API's sync endpoint
 * with the shared secret. The crawl itself runs on the API, which is where the
 * database connection and the importer live — this route only triggers it.
 *
 * Vercel signs its own cron requests with CRON_SECRET as a bearer token, so the
 * same value authorises both hops and no separate credential is needed.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a configured secret the endpoint stays shut rather than open.
  if (!secret) {
    return NextResponse.json(
      { error: 'not_configured', message: 'CRON_SECRET is not set.' },
      { status: 503 },
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }

  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  try {
    const res = await fetch(`${api}/api/sync/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ pages: 2 }),
    });

    return NextResponse.json(
      { triggered: res.ok, status: res.status },
      { status: res.ok ? 202 : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'unreachable', message: err instanceof Error ? err.message : 'API unreachable.' },
      { status: 502 },
    );
  }
}
