import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mailer from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const normEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }

  // 6-значный код
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

  // чистим старые, создаём новый
  await prisma.emailOtp.deleteMany({ where: { email: normEmail } });
  await prisma.emailOtp.create({ data: { email: normEmail, codeHash, expiresAt } });

  // письмо
  await mailer.sendMail({
    to: normEmail,
    from: process.env.EMAIL_FROM,
    subject: 'Ваш код для подтверждения email',
    html: `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
        <p>Ваш код подтверждения:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</div>
        <p style="color:#6c757d;font-size:12px">Срок действия — 10 минут.</p>
      </div>
    `,
    text: `Код: ${code} (действует 10 минут)`,
  });

  return NextResponse.json({ ok: true });
}
