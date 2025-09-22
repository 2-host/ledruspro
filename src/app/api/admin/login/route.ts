// src/app/api/admin/login/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

async function parseCreds(req: Request) {
  const ct = (req.headers.get('content-type') || '').toLowerCase();

  // JSON
  if (ct.includes('application/json')) {
    const b = await req.json().catch(() => ({} as any));
    return {
      login: (b.login ?? '').toString().trim(),
      pass:  (b.pass  ?? '').toString().trim(),
      from:  (b.from  ?? '').toString(),
    };
  }

  // x-www-form-urlencoded (классические <form method="post">)
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
      login: ((fd.get('login') as string) ?? '').trim(),
      pass:  ((fd.get('pass')  as string) ?? '').trim(),
      from:  (fd.get('from') as string) ?? '',
    };
  }

  // fallback — попробуем formData, потом JSON
  try {
    const fd = await req.formData();
    return {
      login: ((fd.get('login') as string) ?? '').trim(),
      pass:  ((fd.get('pass')  as string) ?? '').trim(),
      from:  (fd.get('from') as string) ?? '',
    };
  } catch {}

  const b = await req.json().catch(() => ({} as any));
  return {
    login: (b.login ?? '').toString().trim(),
    pass:  (b.pass  ?? '').toString().trim(),
    from:  (b.from  ?? '').toString(),
  };
}

export async function POST(req: Request) {
  const { login, pass, from } = await parseCreds(req);

  const envLogin = (process.env.ADMIN_LOGIN || '').trim();
  const envPass  = (process.env.ADMIN_PASSWORD || '').trim();
  const secret   = (process.env.ADMIN_SESSION_SECRET || '').trim();

  // быстрая проверка наличия env (удобно в деве)
  if (!envLogin || !envPass || !secret) {
    return NextResponse.json(
      { error: 'Server is not configured: missing ADMIN_LOGIN / ADMIN_PASSWORD / ADMIN_SESSION_SECRET' },
      { status: 500 }
    );
  }

  if (!login || !pass || login !== envLogin || pass !== envPass) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, redirectTo: from || '/admin' });
  res.cookies.set('admin_session', secret, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // неделя
  });
  return res;
}
