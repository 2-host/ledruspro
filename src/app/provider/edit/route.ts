import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signEditToken } from '@/lib/magic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const pidStr = url.searchParams.get('pid') || '';
  const pid = Number(pidStr);

  if (!token || !Number.isFinite(pid)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Валидируем одноразовый логин-токен по БД (EmailVerification)
  const ev = await prisma.emailVerification.findUnique({ where: { token } });
  if (!ev || ev.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/?login=fail', req.url));
  }

  // Проверяем, что pid принадлежит этому email
  const provider = await prisma.provider.findUnique({ where: { id: pid }, select: { ownerEmail: true } });
  if (!provider || (provider.ownerEmail || '').toLowerCase() !== ev.email.toLowerCase()) {
    return NextResponse.redirect(new URL('/?login=forbidden', req.url));
  }

  // Выдаём JWT для редактирования конкретного провайдера, кладём в cookie
  const editJwt = await signEditToken({ email: ev.email, pid }, 60 * 60); // 1 час

  const redirectUrl = new URL(`/provider/${pid}/edit`, req.url);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set('edit_token', editJwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });

  return res;
}
