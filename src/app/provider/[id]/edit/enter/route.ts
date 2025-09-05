import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const id = Number(params.id);
  if (!token || !Number.isFinite(id)) {
    return NextResponse.redirect(new URL(`/provider/${params.id}`, url.origin));
  }
  try {
    const payload = await verifyEditToken(token);
    if (payload.pid !== id) throw new Error('mismatch');
    cookies().set('edit_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 30,
    });
    return NextResponse.redirect(new URL(`/provider/${id}/edit`, url.origin));
  } catch {
    return NextResponse.redirect(new URL(`/provider/${id}?err=signin`, url.origin));
  }
}
