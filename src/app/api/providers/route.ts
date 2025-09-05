// src/app/api/providers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic'; // <— важно

export const runtime = 'nodejs';

function slugify(input: string) {
  const map: Record<string, string> = {
    ё:'e', й:'i', ц:'c', у:'u', к:'k', е:'e', н:'n', г:'g', ш:'sh', щ:'sch', з:'z', х:'h', ъ:'',
    ф:'f', ы:'y', в:'v', а:'a', п:'p', р:'r', о:'o', л:'l', д:'d', ж:'zh', э:'e',
    я:'ya', ч:'ch', с:'s', м:'m', и:'i', т:'t', ь:'', б:'b', ю:'yu'
  };
  return input.toLowerCase()
    .replace(/[а-яё]/g, ch => map[ch] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
export async function POST(req: Request) {
  try {
    // 1) Авторизация — читаем email из edit_token
    const c = await cookies();
    const edit = c.get('edit_token')?.value;
    if (!edit) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    let ownerEmail = '';
    try {
      const payload = await verifyEditToken(edit); // { email, pid? ... }
      ownerEmail = payload.email;
    } catch {
      return NextResponse.json({ error: 'Сессия недействительна' }, { status: 401 });
    }

    // 2) Читаем форму (как у тебя было)
    const form = await req.formData();

    const name = String(form.get('name') || '').trim();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const type = String(form.get('type') || 'company');
    const city = String(form.get('city') || '').trim() || null;
    const about = String(form.get('about') || '').trim() || null;
    const phone = String(form.get('phone') || '').trim() || null;
    const website = String(form.get('website') || '').trim() || null;

    let experienceYears: number | null = null;
    const expRaw = form.get('experienceYears');
    if (typeof expRaw === 'string' && expRaw !== '') {
      const n = Number(expRaw);
      experienceYears = Number.isFinite(n) ? Math.max(0, Math.min(60, n)) : null;
    }

    let avatarUrl: string | null = null;
    const avatar = form.get('avatar') as File | null;
    if (avatar && (avatar as any).size > 0) {
      avatarUrl = await saveFile(avatar, 'avatar');
    }

    let services: Array<{ name: string; priceFrom?: number|null; unit?: string|null; description?: string|null }> = [];
    const servicesJson = form.get('services');
    if (typeof servicesJson === 'string' && servicesJson.trim()) {
      try {
        const parsed = JSON.parse(servicesJson);
        if (Array.isArray(parsed)) services = parsed.slice(0, 100);
      } catch {}
    }

    const categoryIds = form.getAll('categories')
      .map(v => Number(v))
      .filter(n => Number.isFinite(n)) as number[];

    const portfolioFiles = form.getAll('portfolioFiles') as File[];
    const portfolioTitles: string[] = [];
    for (let i = 0; i < portfolioFiles.length; i++) {
      const t = form.get(`portfolioTitle_${i}`);
      portfolioTitles.push(typeof t === 'string' ? t : '');
    }

    // slug
    let slug = slugify(name) || `provider-${Date.now()}`;
    if (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 3) Создаём провайдера — ownerEmail берём из токена
    const created = await prisma.provider.create({
      data: {
        name,
        slug,
        title: type === 'company' ? 'Студия / Компания' : 'Частный специалист',
        city,
        about,
        phone,
        website,
        avatarUrl,
        ownerEmail, // ← отсюда!
        experienceYears: experienceYears ?? undefined,
        isVerified: false,
        services: services.length
          ? {
              create: services.map(s => ({
                name: s.name,
                priceFrom: s.priceFrom ?? null,
                unit: s.unit ?? null,
                description: s.description ?? null,
              })),
            }
          : undefined,
        categories: categoryIds.length
          ? { create: categoryIds.map(categoryId => ({ categoryId })) }
          : undefined,
      },
      select: { id: true },
    });

    // 4) Портфолио
    const images: { imageUrl: string; title?: string }[] = [];
    for (let i = 0; i < portfolioFiles.length; i++) {
      const f = portfolioFiles[i];
      if (f && (f as any).size > 0) {
        const url = await saveFile(f, 'portfolio');
        images.push({ imageUrl: url, title: portfolioTitles[i] || `Проект #${i+1}` });
      }
    }
    if (images.length) {
      await prisma.project.createMany({
        data: images.map(img => ({
          providerId: created.id,
          imageUrl: img.imageUrl,
          title: img.title,
        })),
      });
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e: any) {
    console.error('Create provider error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}