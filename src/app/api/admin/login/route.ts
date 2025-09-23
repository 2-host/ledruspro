// src/app/api/admin/login/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionSecret } from '@/src/lib/adminAuth';

export const runtime = 'nodejs';
export const revalidate = 0;

async function parseCreds(req: NextRequest) {
  const ct = (req.headers.get('content-type') || '').toLowerCase();

  // JSON
  if (ct.includes('application/json')) {
    const b = await req.json().catch(() => ({} as Record<string, unknown>));
    return {
      login: String(b.login ?? '').trim(),
      pass:  String(b.pass  ?? '').trim(),
      from:  String(b.from  ?? ''),
    };
  }

  // x-www-form-urlencoded
  if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const p = new URLSearchParams(text);
    return {
      login: (p.get('login') ?? '').trim(),
      pass:  (p.get('pass')  ?? '').trim(),
      from:  p.get('from') ?? '',
    };
  }

  // multipart/form-data
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    return {
      login: String((fd.get('login') as string) ?? '').trim(),
      pass:  String((fd.get('pass')  as string) ?? '').trim(),
      from:  String((fd.get('from')  as string) ?? ''),
    };
  }

  // fallback
  try {
    const fd = await req.formData();
    return {
      login: String((fd.get('login') as string) ?? '').trim(),
      pass:  String((fd.get('pass')  as string) ?? '').trim(),
      from:  String((fd.get('from')  as string) ?? ''),
    };
  } catch {}

  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  return {
    login: String(b.login ?? '').trim(),
    pass:  String(b.pass  ?? '').trim(),
    from:  String(b.from  ?? ''),
  };
}

export async function POST(req: NextRequest) {
  const { login, pass, from } = await parseCreds(req);

  const envLogin = (process.env.ADMIN_LOGIN || '').trim();
  const envPass  = (process.env.ADMIN_PASSWORD || '').trim();
  const secret   = getSessionSecret().trim();

  if (!envLogin || !envPass || !secret) {
    return NextResponse.json(
      { error: 'Server is not configured: missing ADMIN_LOGIN / ADMIN_PASSWORD / ADMIN_SESSION_SECRET' },
      { status: 500 }
    );
  }

  if (!login || !pass || login !== envLogin || pass !== envPass) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
  }

  // Разрешаем редирект только внутрь сайта
  const nextPath =
    typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
      ? from
      : '/admin';

  // Ставим куку и сразу редиректим (удобнее для клиента/браузера)
  const res = NextResponse.redirect(new URL(nextPath, req.url));
  res.cookies.set({
    name: 'admin_session',
    value: secret,
    httpOnly: true,
    secure: true,          // прод на HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // неделя
    // domain: 'pro.ledrus.org', // раскомментируй, если ставишь куку с другого поддомена
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
