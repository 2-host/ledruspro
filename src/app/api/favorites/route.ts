import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids');
  if (!idsParam) return NextResponse.json([]);

  const idArr = idsParam
    .split(',')
    .map(x => Number(x))
    .filter(Boolean);

  if (idArr.length === 0) return NextResponse.json([]);

  const providers = await prisma.provider.findMany({
    where: { id: { in: idArr } },
    select: {
      id: true,
      name: true,
      city: true,
      about: true,
      avatarUrl: true,
      passportVerified: true,
      worksByContract: true,
      services: { select: { id: true, name: true, priceFrom: true } },
    },
  });

  // сохраняем порядок, как в localStorage
  const map = new Map(providers.map(p => [p.id, p]));
  const ordered = idArr.map(id => map.get(id)).filter(Boolean);

  return NextResponse.json(ordered);
}
