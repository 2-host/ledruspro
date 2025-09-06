// src/app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }   // <-- Promise
) {
  try {
    const { id: idStr } = await params;              // <-- await
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();

    const payload: Record<string, string | null> = {};
    for (const k of ['name', 'slug', 'seoTitle', 'seoDescription', 'seoKeywords', 'seoH1'] as const) {
      if (k in body) {
        const v = (body as any)[k];
        payload[k] = v === '' || v == null ? null : String(v);
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: payload,
      select: {
        id: true, name: true, slug: true,
        seoTitle: true, seoDescription: true, seoKeywords: true, seoH1: true,
      },
    });

    return NextResponse.json({ ok: true, category: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// При желании можно сразу добавить и DELETE:
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
