import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({}));
  const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawCode = typeof code === 'string' ? code.trim() : '';

  if (!normEmail || !rawCode) return NextResponse.json({ error: 'email и code обязательны' }, { status: 400 });

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

  // одноразовый токен на 30 минут
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.emailVerification.create({ data: { email: normEmail, token, expiresAt } });
  await prisma.emailOtp.delete({ where: { id: otp.id } });

  return NextResponse.json({ token });
}
