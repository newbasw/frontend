import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'bw_session';
const PROTECTED = ['/account', '/favorites', '/admin'];

/**
 * First gate for protected routes: no session cookie means no page render.
 * The pages themselves re-verify the token against the API, so a forged or
 * expired cookie still cannot reach protected data — this only avoids a
 * pointless round trip and a flash of empty UI.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.get(AUTH_COOKIE)?.value) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/account/:path*', '/favorites/:path*', '/admin/:path*'],
};
