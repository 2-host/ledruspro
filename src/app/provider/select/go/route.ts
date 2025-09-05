// src/app/provider/select/go/route.ts
import { NextResponse } from 'next/server';
import { verifyEditToken } from '@/lib/magic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const pidStr = searchParams.get('pid');

  if (!token || !pidStr) return NextResponse.redirect(new URL('/?login=fail', req.url));

  try {
    const payload = await verifyEditToken(token);
    if (!payload?.pid || String(payload.pid) !== pidStr) {
      return NextResponse.redirect(new URL('/?login=fail', req.url));
    }
    const res = NextResponse.redirect(new URL(`/provider/${pidStr}/edit`, req.url));
    res.cookies.set('edit_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL('/?login=fail', req.url));
  }
}
