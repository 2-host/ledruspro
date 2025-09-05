import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const cat = await prisma.category.findUnique({ where: { id } });
  return cat ? NextResponse.json(cat) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const data: any = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.slug === 'string') data.slug = body.slug;
  try {
    const updated = await prisma.category.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}