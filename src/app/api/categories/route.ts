// src/app/api/categories/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

function isAdmin() {
  const token = cookies().get('admin_session')?.value;
  return token && token === process.env.ADMIN_SESSION_SECRET;
}

export const runtime = 'nodejs';
export const revalidate = 0;

function slugify(input: string) {
  const map: Record<string, string> = {
    ё:'e', й:'i', ц:'c', у:'u', к:'k', е:'e', н:'n', г:'g', ш:'sh', щ:'sch', з:'z', х:'h', ъ:'',
    ф:'f', ы:'y', в:'v', а:'a', п:'p', р:'r', о:'o', л:'l', д:'d', ж:'zh', э:'e',
    я:'ya', ч:'ch', с:'s', м:'m', и:'i', т:'t', ь:'', б:'b', ю:'yu'
  };
  return input
    .toLowerCase()
    .replace(/[а-яё]/g, ch => map[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** GET /api/categories — дерево: корни + дети */
export async function GET() {
  try {
    const roots = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true, fullSlug: true },
        },
      },
    });

    const data = roots.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      fullSlug: r.fullSlug,
      children: r.children.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        fullSlug: c.fullSlug,
      })),
    }));

    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('GET /api/categories error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** POST /api/categories — создаёт категорию (доступ ограничивает middleware) */
export async function POST(req: NextRequest) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const nameRaw = String(body?.name ?? '').trim();
    let slugRaw = String(body?.slug ?? '').trim();
    const parentIdRaw = body?.parentId;

    const seoTitle = body?.seoTitle ? String(body.seoTitle) : null;
    const seoDescription = body?.seoDescription ? String(body.seoDescription) : null;
    const seoKeywords = body?.seoKeywords ? String(body.seoKeywords) : null;
    const seoH1 = body?.seoH1 ? String(body.seoH1) : null;

    if (!nameRaw) {
      return NextResponse.json({ error: 'name обязателен' }, { status: 400 });
    }

    const normalizedSlug = slugify(slugRaw || nameRaw);
    if (!normalizedSlug) {
      return NextResponse.json({ error: 'Не удалось сформировать slug' }, { status: 400 });
    }

    // parentId / level / fullSlug
    let parentId: number | null = null;
    let parentFullSlug: string | null = null;
    if (parentIdRaw != null) {
      const pid = Number(parentIdRaw);
      if (!Number.isFinite(pid)) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
      }
      const parent = await prisma.category.findUnique({
        where: { id: pid },
        select: { id: true, fullSlug: true, parentId: true },
      });
      if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 400 });
      if (parent.parentId != null) {
        return NextResponse.json({ error: 'Только два уровня категорий допускается' }, { status: 400 });
      }
      parentId = parent.id;
      parentFullSlug = parent.fullSlug;
    }

    const fullSlug = parentFullSlug ? `${parentFullSlug}/${normalizedSlug}` : normalizedSlug;
    const level = parentId ? 2 : 1;

    const created = await prisma.category.create({
      data: {
        name: nameRaw,
        slug: normalizedSlug,
        parentId,
        level,
        fullSlug,
        seoTitle,
        seoDescription,
        seoKeywords,
        seoH1,
      },
      select: { id: true, name: true, slug: true, fullSlug: true, parentId: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Категория с таким slug уже существует' }, { status: 409 });
    }
    console.error('POST /api/categories error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
