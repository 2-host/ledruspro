// src/app/api/categories/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';

export const runtime = 'nodejs';
export const revalidate = 0; // не кэшируем ответы этого роутинга

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

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(cats, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('GET /api/categories error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // простая защита: требуем edit_token
    const c = await cookies();
    const token = c.get('edit_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      await verifyEditToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nameRaw = String(body?.name ?? '').trim();
    let slugRaw = String(body?.slug ?? '').trim();
    const seoTitle = body?.seoTitle ? String(body.seoTitle) : null;
    const seoDescription = body?.seoDescription ? String(body.seoDescription) : null;
    const seoKeywords = body?.seoKeywords ? String(body.seoKeywords) : null;
    const seoH1 = body?.seoH1 ? String(body.seoH1) : null;

    if (!nameRaw) {
      return NextResponse.json({ error: 'name обязателен' }, { status: 400 });
    }
    // slug формируем/нормализуем на бэке
    const normalizedSlug = slugify(slugRaw || nameRaw);
    if (!normalizedSlug) {
      return NextResponse.json({ error: 'Не удалось сформировать slug' }, { status: 400 });
    }

    // проверим конфликт заранее (чтобы дать 409)
    const exists = await prisma.category.findUnique({ where: { slug: normalizedSlug } });
    if (exists) {
      return NextResponse.json({ error: 'Категория с таким slug уже существует' }, { status: 409 });
    }

    const created = await prisma.category.create({
      data: {
        name: nameRaw,
        slug: normalizedSlug,
        seoTitle,
        seoDescription,
        seoKeywords,
        seoH1,
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // P2002 — уникальный индекс
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Категория с таким slug уже существует' }, { status: 409 });
    }
    console.error('POST /api/categories error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
