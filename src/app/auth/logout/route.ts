import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const c = await cookies();
  c.set('edit_token', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return NextResponse.redirect(new URL('/', req.url));
}
