// src/app/provider/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';
import ProviderEditForm from '@/components/ProviderEditForm';
import { notFound, redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>; // << важно: Promise
};

export default async function EditProviderPage({ params }: Props) {
  // Next 15: params нужно await-ить
  const { id: idStr } = await params;

  // если сегмент не число — 404
  if (!/^\d+$/.test(idStr)) return notFound();
  const id = Number(idStr);

  // Next 15: cookies() тоже нужно await-ить
  const c = await cookies();
  const token = c.get('edit_token')?.value;

  if (!token) {
    // нет сессии редактирования — отправим на вход с возвратом назад
    redirect(`/?login=required&return=/provider/${id}/edit`);
  }

  // проверяем JWT из cookie
  let ok = false;
  try {
    const payload = await verifyEditToken(token);
    ok = payload?.pid === id;
  } catch {
    ok = false;
  }

  if (!ok) {
    // токен невалиден или для другого профиля
    redirect('/provider/select');
  }

  // грузим данные для формы
  const [p, cats] = await Promise.all([
    prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        categories: { include: { category: true } },
        projects: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!p) return notFound();

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
