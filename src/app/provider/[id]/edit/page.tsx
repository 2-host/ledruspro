// src/app/provider/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import ProviderEditForm from '@/components/ProviderEditForm';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyEditToken, signEditToken } from '@/lib/magic';

type Props = { params: Promise<{ id: string }> };

// Имена кук: поправьте при необходимости
const COOKIE_TOKEN = 'edit_token';
const COOKIE_EMAIL = 'email'; // если у вас другая — замените, напр. 'user_email'

export default async function EditProviderPage({ params }: Props) {
  const { id: idStr } = await params;
  if (!/^\d+$/.test(idStr)) return notFound();
  const id = Number(idStr);

  // --- читаем куки
  const c = await cookies();
  const token = c.get(COOKIE_TOKEN)?.value || null;
  const emailCookie = c.get(COOKIE_EMAIL)?.value?.toLowerCase().trim() || null;

  if (!token) {
    redirect(`/?login=required&return=/provider/${id}/edit`);
  }

  // --- валидируем токен (несёт email и pid)
  let payloadEmail: string | null = null;
  let payloadPid: number | null = null;
  try {
    const payload = await verifyEditToken(token!);
    payloadEmail =
      (payload?.email && String(payload.email).toLowerCase().trim()) || null;
    payloadPid = typeof payload?.pid === 'number' ? payload.pid : null;
  } catch {
    redirect(`/?login=required&return=/provider/${id}/edit`);
  }

  // email сессии берём из токена, если есть; иначе — из отдельной куки
  const sessionEmail = (payloadEmail || emailCookie || '').toLowerCase().trim();
  if (!sessionEmail) {
    redirect(`/?login=required&return=/provider/${id}/edit`);
  }

  // --- грузим провайдера
  const p = await prisma.provider.findUnique({
    where: { id },
    include: {
      services: true,
      categories: { include: { category: true } },
      projects: true,
    },
  });
  if (!p) return notFound();

  // --- проверяем право: владелец = email из токена
  const owner = (p.ownerEmail || '').toLowerCase().trim();
  if (!owner || owner !== sessionEmail) {
    redirect('/provider/select');
  }

  // --- опционально: если токен выписан под другой pid, перевыпишем под текущий
  if (payloadPid !== id) {
    try {
      const newToken = await signEditToken(sessionEmail, id);
      c.set(COOKIE_TOKEN, newToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60, // 1 час
      });
    } catch {
      // молча игнорируем — это не критично для рендера
    }
  }

  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Редактирование: {p.name}</h1>
        <a className="btn btn-outline-secondary btn-sm" href={`/provider/${id}`}>К профилю</a>
      </div>
      <ProviderEditForm initial={p} allCategories={cats} />
    </div>
  );
}
