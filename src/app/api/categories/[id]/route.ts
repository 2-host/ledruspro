// src/app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const revalidate = 0;

// ВАЖНО: в роут-хендлерах cookies() нужно AWAIT
async function isAdmin() {
  const store = await cookies();
  const token = store.get('admin_session')?.value;
  return Boolean(token && token === (process.env.ADMIN_SESSION_SECRET || ''));
}

/** GET /api/categories/:id — детали категории (для формы редактирования) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const cat = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, fullSlug: true, level: true, parentId: true,
        seoTitle: true, seoDescription: true, seoKeywords: true, seoH1: true,
        parent: { select: { id: true, name: true, slug: true, fullSlug: true } },
      },
    });
    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(cat, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('[GET /api/categories/:id] error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PATCH /api/categories/:id — обновить и пересчитать fullSlug/level */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const b = await req.json();

    // Разрешённые поля
    const data: any = {};
    for (const k of ['name', 'slug', 'seoTitle', 'seoDescription', 'seoKeywords', 'seoH1'] as const) {
      if (k in b) data[k] = b[k] === '' || b[k] == null ? null : String(b[k]);
    }

    // parentId
    let newParentId: number | null | undefined = undefined;
    if ('parentId' in b) {
      if (b.parentId === '' || b.parentId == null) newParentId = null;
      else {
        const pid = Number(b.parentId);
        if (!Number.isFinite(pid)) {
          return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
        }
        if (pid === id) {
          return NextResponse.json({ error: 'Категория не может быть родителем самой себя' }, { status: 400 });
        }
        newParentId = pid;
      }
    }

    const current = await prisma.category.findUnique({
      where: { id },
      select: { id: true, slug: true, parentId: true },
    });
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parentId = newParentId === undefined ? current.parentId : newParentId;

    let parentFullSlug: string | null = null;
    if (parentId != null) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
        select: { id: true, fullSlug: true, parentId: true },
      });
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 400 });
      if (parent.parentId != null) {
        return NextResponse.json({ error: 'Только два уровня категорий' }, { status: 400 });
      }
      parentFullSlug = parent.fullSlug;
    }

    const slug = (data.slug ?? current.slug) as string;
    const fullSlug = parentFullSlug ? `${parentFullSlug}/${slug}` : slug;
    const level = parentId ? 2 : 1;

    // Обновляем саму категорию
    const updated = await prisma.category.update({
      where: { id },
      data: { ...data, parentId, level, fullSlug },
      select: {
        id: true, name: true, slug: true, fullSlug: true, parentId: true,
        seoTitle: true, seoDescription: true, seoKeywords: true, seoH1: true,
      },
    });

    // Если это корень — обновим fullSlug у прямых детей
    if (!parentId) {
      const children = await prisma.category.findMany({
        where: { parentId: updated.id },
        select: { id: true, slug: true },
      });
      if (children.length) {
        await prisma.$transaction(
          children.map((ch) =>
            prisma.category.update({
              where: { id: ch.id },
              data: { fullSlug: `${updated.fullSlug}/${ch.slug}` },
            })
          )
        );
      }
    }

    return NextResponse.json({ ok: true, category: updated });
  } catch (e: any) {
    // P2002 — уникальный индекс (например, slug)
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Категория с таким slug уже существует' },
        { status: 409 }
      );
    }
    console.error('[PATCH /api/categories/:id] error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE /api/categories/:id — запретить удаление, если есть дети */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Сначала удалите/перенесите подкатегории' },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/categories/:id] error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
