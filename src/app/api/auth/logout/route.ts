// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  // гасим cookie
  cookieStore.set('edit_token', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });
  return NextResponse.json({ ok: true });
}
