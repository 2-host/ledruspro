// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const providerId = Number(form.get('providerId') || 0);
  const name = String(form.get('name') || '');
  const contact = String(form.get('contact') || '');
  const message = String(form.get('message') || '');

  if (!providerId || !name || !contact) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  await prisma.lead.create({
    data: { providerId, name, contact, message },
  });

  return NextResponse.json({ ok: true });
}
