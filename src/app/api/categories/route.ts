import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const slug = String(body.slug || '').trim();
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
  try {
    const created = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 });
  }
}