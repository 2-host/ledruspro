import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Защищаем /admin целиком
  const isAdmin = pathname.startsWith('/admin');

  // И защищаем любые НЕ-POST запросы к /api/providers/* (PATCH/DELETE/GET)
  const isProvidersApi = pathname.startsWith('/api/providers') && req.method !== 'POST';

  if (!(isAdmin || isProvidersApi)) {
    return NextResponse.next();
  }

  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return unauthorized();

  try {
    const decoded = Buffer.from(header.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
      return NextResponse.next();
    }
  } catch {}

  return unauthorized();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/providers/:path*',
  ],
};