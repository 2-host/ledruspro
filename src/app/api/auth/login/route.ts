// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { signEditToken } from '@/lib/magic';

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({}));
  const normEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawCode =
    typeof code === 'string' ? code.trim() : '';

  if (!normEmail || !rawCode) {
    return NextResponse.json({ error: 'email и code обязательны' }, { status: 400 });
  }

  // находим OTP
  const otp = await prisma.emailOtp.findFirst({ where: { email: normEmail } });
  if (!otp) return NextResponse.json({ error: 'Код не запрошен' }, { status: 400 });
  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { id: otp.id } });
    return NextResponse.json({ error: 'Код истёк' }, { status: 400 });
  }
  if (otp.attempts >= 5) return NextResponse.json({ error: 'Слишком много попыток' }, { status: 429 });

  const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
  const ok = codeHash === otp.codeHash;

  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (!ok) return NextResponse.json({ error: 'Неверный код' }, { status: 400 });

  // Удаляем использованный код
  await prisma.emailOtp.delete({ where: { id: otp.id } });

  // Выдаём JWT с ТОЛЬКО email (pid ещё не выбрали)
  const token = await signEditToken(normEmail, undefined, 60 * 60); // 1 час

  const res = NextResponse.json({
    ok: true,
    redirect: '/provider/select', // фронт просто уйдёт по этому адресу
  });

  res.cookies.set('edit_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });

  return res;
}
