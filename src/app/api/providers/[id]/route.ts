// src/app/api/providers/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';

function slugify(input: string) {
  const map: Record<string, string> = {
    'ё':'e','й':'i','ц':'c','у':'u','к':'k','е':'e','н':'n','г':'g','ш':'sh','щ':'sch','з':'z','х':'h','ъ':'',
    'ф':'f','ы':'y','в':'v','а':'a','п':'p','р':'r','о':'o','л':'l','д':'d','ж':'zh','э':'e',
    'я':'ya','ч':'ch','с':'s','м':'m','и':'i','т':'t','ь':'','б':'b','ю':'yu'
  };
  return input
    .toLowerCase()
    .replace(/[а-яё]/g, ch => map[ch as keyof typeof map] || ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeUploadPath(p?: string | null) {
  if (!p) return null;
  try {
    const url = new URL(p, 'http://local');
    return url.pathname;
  } catch {
    return p;
  }
}

async function saveFile(file: File, prefix: string) {
  const buf = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const ext =
    (file.type?.split('/')[1] ? '.' + file.type.split('/')[1] : path.extname((file as any).name || '')) ||
    '.jpg';
  const name = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
  await fs.writeFile(path.join(uploadsDir, name), buf);
  return `/uploads/${name}`;
}

// Универсальный извлекатель ID провайдера из payload токена (на будущее)
function extractProviderId(payload: any): string | null {
  if (!payload) return null;
  const candidates = [
    payload.pid, payload.providerId, payload.provider_id, payload.provider,
    payload.id, payload.sub, payload.userId, payload.user_id,
  ];
  for (const v of candidates) {
    if (v == null) continue;
    const s = String(v);
    const m = s.match(/\d+/);
    if (m) return m[0];
  }
  return null;
}

// ---------- GET ----------
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      categories: { include: { category: true } },
      services: true,
      reviews: true,
      projects: {
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { sort: 'asc' } } },
      },
    },
  });
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(provider);
}

// ---------- PATCH ----------
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ct = req.headers.get('content-type') || '';

  // === JSON PATCH (админ-форма) ===
  if (ct.includes('application/json')) {
    const body = await req.json();

    const toNum = (v: any) => (v === '' || v == null ? null : Number(v));
    const toInt = (v: any) => (v === '' || v == null ? null : Math.trunc(Number(v)));
    const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1 || v === 'on';

    const allowed = [
      'name','slug','title','city','priceFrom','rating','reviewsCount','isVerified',
      'passportVerified','worksByContract','experienceYears','ownerEmail','website',
      'phone','about','avatarUrl'
    ] as const;

    const data: any = {};
    for (const k of allowed) if (k in body) data[k] = (body as any)[k];

    if ('priceFrom' in data) data.priceFrom = toInt(data.priceFrom);
    if ('rating' in data) data.rating = toNum(data.rating);
    if ('reviewsCount' in data) {
      const n = toInt(data.reviewsCount);
      data.reviewsCount = n == null ? null : Math.max(0, n);
    }
    if ('experienceYears' in data) {
      const n = toInt(data.experienceYears);
      data.experienceYears = n == null ? null : Math.max(0, Math.min(60, n));
    }
    if ('isVerified' in data) data.isVerified = toBool(data.isVerified);
    if ('passportVerified' in data) data.passportVerified = toBool(data.passportVerified);
    if ('worksByContract' in data) data.worksByContract = toBool(data.worksByContract);

    if (typeof data.name === 'string' && (!data.slug || data.slug === '')) {
      data.slug = slugify(data.name);
    }
    if (typeof data.avatarUrl === 'string') data.avatarUrl = normalizeUploadPath(data.avatarUrl);
    if (typeof data.ownerEmail === 'string') {
      const trimmed = data.ownerEmail.trim();
      data.ownerEmail = trimmed === '' ? null : trimmed.toLowerCase();
    }
    if (typeof data.website === 'string') data.website = data.website.trim() || null;
    if (typeof data.phone === 'string') data.phone = data.phone.trim() || null;
    if (typeof data.city === 'string') data.city = data.city.trim() || null;
    if (typeof data.title === 'string') data.title = data.title.trim() || null;
    if (typeof data.about==='string') data.about = data.about.trim() || null;

    await prisma.provider.update({ where: { id }, data });

    if (Array.isArray((body as any).categoryIds)) {
      const categoryIds = ((body as any).categoryIds as any[])
        .map(Number)
        .filter((n) => Number.isFinite(n)) as number[];

      await prisma.providerCategory.deleteMany({ where: { providerId: id } });
      if (categoryIds.length) {
        await prisma.providerCategory.createMany({
          data: categoryIds.map((categoryId) => ({ providerId: id, categoryId })),
        });
      }
    }

    const updated = await prisma.provider.findUnique({
      where: { id },
      include: { categories: { include: { category: true } } },
    });

    return NextResponse.json(updated);
  }

  // === multipart/form-data (само-редактирование по edit_token) ===
  if (ct.includes('multipart/form-data')) {
    const cookieStore = await cookies();
    const token = cookieStore.get('edit_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', reason: 'no_cookie' }, { status: 401 });
    }

    // 1) Декодим токен
    let emailFromToken: string | null = null;
    try {
      const payload = await verifyEditToken(token);
      emailFromToken = (payload as any)?.email ? String((payload as any).email).toLowerCase() : null;

      if (!emailFromToken) {
        return NextResponse.json(
          { error: 'Bad token', reason: 'no_email_in_payload', keys: Object.keys(payload || {}) },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Bad token', reason: 'verify_failed' }, { status: 401 });
    }

    // 2) Проверяем, что ownerEmail провайдера совпадает с email из токена
    const provider = await prisma.provider.findUnique({
      where: { id },
      select: { ownerEmail: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ownerEmail = provider.ownerEmail?.toLowerCase() || null;
    if (!ownerEmail || ownerEmail !== emailFromToken) {
      return NextResponse.json(
        { error: 'Forbidden', reason: 'email_mismatch', expected: ownerEmail, got: emailFromToken },
        { status: 403 }
      );
    }

    try {
      const form = await req.formData();

      const type  = String(form.get('type') || 'company'); // company | individual
      const name  = String(form.get('name') || '').trim();
      if (!name) return NextResponse.json({ error: 'Укажите название/ФИО' }, { status: 400 });

      const city  = String(form.get('city') || '').trim() || null;
      const about = String(form.get('about') || '').trim() || null;
      const phone = String(form.get('phone') || '').trim() || null;
      const website = String(form.get('website') || '').trim() || null;

      const expRaw = String(form.get('experienceYears') || '').trim();
      const experienceYears = expRaw === '' ? null : Math.max(0, Math.min(60, Number(expRaw)));

      const passportVerified = String(form.get('passportVerified') || '0') === '1';
      const worksByContract  = String(form.get('worksByContract')  || '0') === '1';

      let avatarUrl: string | undefined;
      const avatar = form.get('avatar') as File | null;
      if (avatar && (avatar as any).size > 0) {
        avatarUrl = await saveFile(avatar, 'avatar');
      }

      const categoryIds = form.getAll('categories')
        .map(v => Number(v))
        .filter(n => Number.isFinite(n)) as number[];

      let services: Array<{ name: string; priceFrom?: number|null; unit?: string|null; description?: string|null }> = [];
      const servicesJson = form.get('services');
      if (typeof servicesJson === 'string' && servicesJson.trim()) {
        try {
          const parsed = JSON.parse(servicesJson);
          if (Array.isArray(parsed)) services = parsed.slice(0, 100);
        } catch {}
      }

      // существующие проекты: обновление заголовков / удаление целиком
      let existingProjects: Array<{ id: number; title?: string; _delete?: boolean }> = [];
      const existingJson = form.get('existingProjects');
      if (typeof existingJson === 'string' && existingJson.trim()) {
        try {
          const parsed = JSON.parse(existingJson);
          if (Array.isArray(parsed)) existingProjects = parsed;
        } catch {}
      }

      const patch: any = {
        name,
        title: type === 'company' ? 'Студия / Компания' : 'Частный специалист',
        city, about, phone, website,
        experienceYears,
        passportVerified,
        worksByContract,
      };
      if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;

      await prisma.provider.update({ where: { id }, data: patch });

      // перезаписываем услуги
      await prisma.service.deleteMany({ where: { providerId: id } });
      if (services.length) {
        await prisma.service.createMany({
          data: services.map(s => ({
            providerId: id,
            name: s.name,
            priceFrom: s.priceFrom ?? null,
            unit: s.unit ?? null,
            description: s.description ?? null,
          })),
        });
      }

      // перезаписываем категории
      await prisma.providerCategory.deleteMany({ where: { providerId: id } });
      if (categoryIds.length) {
        await prisma.providerCategory.createMany({
          data: categoryIds.map(categoryId => ({ providerId: id, categoryId })),
        });
      }

      // удаление/обновление существующих проектов
      const toDeleteIds = existingProjects.filter(p => p._delete).map(p => p.id);
      if (toDeleteIds.length) {
        await prisma.project.deleteMany({ where: { providerId: id, id: { in: toDeleteIds } } });
      }
      const toUpdate = existingProjects.filter(p => !p._delete && typeof p.title === 'string');
      for (const u of toUpdate) {
        await prisma.project.update({ where: { id: u.id }, data: { title: u.title || null } });
      }

      // === Новые проекты и их изображения (projectTitle_i + projectFiles_i[*]) ===
      const projectIndexes = new Set<number>();
      for (const [key] of form.entries()) {
        const m = key.match(/^projectTitle_(\d+)$/) || key.match(/^projectFiles_(\d+)$/);
        if (m) projectIndexes.add(Number(m[1]));
      }

      for (const idx of projectIndexes) {
        const title = form.get(`projectTitle_${idx}`);
        const files = form.getAll(`projectFiles_${idx}`) as File[];

        const createdProject = await prisma.project.create({
          data: { providerId: id, title: typeof title === 'string' ? title || null : null },
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

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      console.error('PATCH error:', e);
      return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unsupported content-type' }, { status: 400 });
}

// ---------- DELETE ----------
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: { projects: { include: { images: true } } },
  });
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // соберём относительные пути для удаления
  const filesToRemove = new Set<string>();
  if (provider.avatarUrl && provider.avatarUrl.startsWith('/uploads/')) {
    filesToRemove.add(provider.avatarUrl);
  }
  for (const p of provider.projects) {
    for (const img of p.images) {
      if (img.url && img.url.startsWith('/uploads/')) filesToRemove.add(img.url);
    }
  }

  try {
    await prisma.provider.delete({ where: { id } });

    for (const rel of filesToRemove) {
      const abs = path.join(process.cwd(), 'public', rel.replace(/^\/uploads\//, 'uploads/'));
      try { await fs.unlink(abs); } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}
