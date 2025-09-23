// src/app/provider/[id]/edit/enter/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyEditToken } from '@/lib/magic';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Context) {
  const { id: idStr } = ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  const id = Number(idStr);

  // Не валидные параметры → назад на страницу провайдера
  if (!token || !Number.isFinite(id)) {
    return NextResponse.redirect(new URL(`/provider/${idStr}`, url.origin));
  }

  try {
    const payload = await verifyEditToken(token);
    if (payload.pid !== id) throw new Error('mismatch');

    // Ставим куку через ответ (надёжнее в route handlers)
    const res = NextResponse.redirect(new URL(`/provider/${id}/edit`, url.origin));
    res.cookies.set({
      name: 'edit_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,         // прод на HTTPS
      path: '/',
      maxAge: 60 * 30,      // 30 минут
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL(`/provider/${id}?err=signin`, url.origin));
  }
}
