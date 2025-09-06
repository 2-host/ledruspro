// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, slug, seoTitle, seoDescription, seoKeywords, seoH1 } = data;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name, slug обязательны' }, { status: 400 });
    }

    const created = await prisma.category.create({
      data: {
        name: String(name),
        slug: String(slug),
        seoTitle: seoTitle ? String(seoTitle) : null,
        seoDescription: seoDescription ? String(seoDescription) : null,
        seoKeywords: seoKeywords ? String(seoKeywords) : null,
        seoH1: seoH1 ? String(seoH1) : null,
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
