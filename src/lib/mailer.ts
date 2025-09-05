// src/lib/mailer.ts
import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.EMAIL_SERVER_HOST!;
  const port = Number(process.env.EMAIL_SERVER_PORT || 465);
  const secure = port === 465; // 465 — SMTPS, 587 — STARTTLS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_SERVER_USER!,
      pass: process.env.EMAIL_SERVER_PASSWORD!,
    },
    family: 4,                 // форсим IPv4
    tls: { servername: host }, // SNI
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    logger: true,
    debug: true,
  });
}

// Именованный и дефолтный экспорт одного и того же инстанса — чтобы любой импорт сработал
export const mailer = createTransport();
export default mailer;
