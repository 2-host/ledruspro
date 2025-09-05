// src/app/api/auth/switch/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyEditToken, signEditToken } from '@/lib/magic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = Number(url.searchParams.get('pid'));
  if (!Number.isFinite(pid)) {
    return NextResponse.redirect(new URL('/', url), { status: 302 });
  }

  const c = await cookies();
  const token = c.get('edit_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/?login=required', url), { status: 302 });

  let email: string | null = null;
  try {
    const payload = await verifyEditToken(token); // { email }
    email = payload.email;
  } catch {
    return NextResponse.redirect(new URL('/?login=fail', url), { status: 302 });
  }

  // Проверим, что профиль принадлежит этому email
  const p = await prisma.provider.findUnique({ where: { id: pid }, select: { ownerEmail: true } });
  if (!p || p.ownerEmail?.toLowerCase() !== email) {
    return NextResponse.redirect(new URL('/?login=fail', url), { status: 302 });
  }

  // Выдаём новый токен уже с pid
  const newToken = await signEditToken(email, pid, 60 * 60);
  const res = NextResponse.redirect(new URL(`/provider/${pid}/edit`, url), { status: 302 });
  res.cookies.set('edit_token', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });
  return res;
}
