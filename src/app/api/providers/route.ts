// src/app/api/providers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic'; // <— важно

export const runtime = 'nodejs';

// Сохранение файла в /public/uploads/<folder>/...
async function saveFile(file: File, folder = 'misc'): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const original = file.name || 'upload.bin';
  const ext = path.extname(original) || '.bin';
  const name = crypto.randomBytes(8).toString('hex') + ext.toLowerCase();

  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);

  return `/uploads/${folder}/${name}`;
}

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
    // 1) Авторизация — email берём из edit_token
    const c = await cookies();
    const edit = c.get('edit_token')?.value;
    if (!edit) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    let ownerEmail = '';
    try {
      const payload = await verifyEditToken(edit); // { email, ... }
      ownerEmail = String(payload.email).toLowerCase().trim();
    } catch {
      return NextResponse.json({ error: 'Сессия недействительна' }, { status: 401 });
    }

    // 2) Читаем форму
    const form = await req.formData();

    const name = String(form.get('name') || '').trim();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const type = String(form.get('type') || 'company');
    const city = (String(form.get('city') || '').trim() || null);
    const about = (String(form.get('about') || '').trim() || null);
    const phone = (String(form.get('phone') || '').trim() || null);
    const website = (String(form.get('website') || '').trim() || null);

    let experienceYears: number | null = null;
    const expRaw = form.get('experienceYears');
    if (typeof expRaw === 'string' && expRaw !== '') {
      const n = Number(expRaw);
      experienceYears = Number.isFinite(n) ? Math.max(0, Math.min(60, n)) : null;
    }

    let avatarUrl: string | null = null;
    const avatar = form.get('avatar');
    if (avatar instanceof File && avatar.size > 0) {
      // if (!avatar.type.startsWith('image/')) { ... } // при желании
      avatarUrl = await saveFile(avatar, 'avatar');
    }

    // услуги
    let services: Array<{ name: string; priceFrom?: number|null; unit?: string|null; description?: string|null }> = [];
    const servicesJson = form.get('services');
    if (typeof servicesJson === 'string' && servicesJson.trim()) {
      try {
        const parsed = JSON.parse(servicesJson);
        if (Array.isArray(parsed)) services = parsed.slice(0, 100);
      } catch {}
    }

    // категории
    const categoryIds = form.getAll('categories')
      .map(v => Number(v))
      .filter(n => Number.isFinite(n)) as number[];

    // slug
    let slug = slugify(name) || `provider-${Date.now()}`;
    if (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 3) Создаём провайдера
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
        ownerEmail,
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

    // 4) Портфолио: проекты с несколькими изображениями (projectTitle_i + projectFiles_i[*])
    const projectIndexes = new Set<number>();
    for (const [key] of form.entries()) {
      const m = key.match(/^projectTitle_(\d+)$/) || key.match(/^projectFiles_(\d+)$/);
      if (m) projectIndexes.add(Number(m[1]));
    }

    for (const idx of projectIndexes) {
      const title = form.get(`projectTitle_${idx}`);
      const files = form.getAll(`projectFiles_${idx}`) as File[];

      const createdProject = await prisma.project.create({
        data: { providerId: created.id, title: typeof title === 'string' ? title || null : null },
        select: { id: true },
      });

      let sort = 0;
      for (const f of files) {
        if (!(f instanceof File) || f.size <= 0) continue;
        const url = await saveFile(f, 'portfolio');
        await prisma.projectImage.create({
          data: { projectId: createdProject.id, url, title: (f as any).name || null, sort: sort++ },
        });
      }
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e: any) {
    console.error('Create provider error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
