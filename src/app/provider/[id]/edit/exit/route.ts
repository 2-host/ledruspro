import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  cookies().set('edit_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/provider/${params.id}`, url.origin));
}
