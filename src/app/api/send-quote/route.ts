import { NextRequest, NextResponse } from 'next/server';
import mailer from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { providerId, providerName, serviceName, name, contact, message } = body;

  if (!name || !contact) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  // запускаем отправку в фоне
  mailer
    .sendMail({
      from: `"Сайт каталог" <${process.env.EMAIL_SERVER_USER}>`,
      to: process.env.ADMIN_EMAIL!,
      subject: `Запрос сметы от ${name}`,
      text: `
Имя: ${name}
Контакты: ${contact}
Провайдер: ${providerName} (ID ${providerId})
Услуга: ${serviceName || '—'}

Сообщение:
${message || '—'}
      `,
    })
    .catch(err => console.error('Mail send error', err));

  // сразу отвечаем пользователю
  return NextResponse.json({ ok: true });
}
