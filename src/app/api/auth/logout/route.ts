import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getBase(): string {
  // Явный домен из ENV — самый надёжный способ
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_URL;
  if (!base) throw new Error('Base URL is not set');
  return base.replace(/\/+$/, '');
}

async function doLogout() {
  const c = await cookies();
  c.set('edit_token', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  const base = getBase();                 // например
  return NextResponse.redirect(new URL('/', base)); // абсолютный URL обязателен
}

export async function GET() {
  return doLogout();
}
export async function POST() {
  return doLogout();
}
