// src/app/provider/select/page.tsx
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProviderSelectPage() {
  const c = await cookies();
  const token = c.get('edit_token')?.value;
  if (!token) redirect('/?login=required');

  let email: string | null = null;
  try {
    const payload = await verifyEditToken(token); // { email, pid? }
    email = payload.email;
  } catch {
    redirect('/?login=fail');
  }
  if (!email) redirect('/?login=fail');

  const providers = await prisma.provider.findMany({
    where: { ownerEmail: email },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, city: true, avatarUrl: true },
  });

  if (providers.length === 0) redirect('/provider/new');
  if (providers.length === 1) {
    // Просто идём на свитчер, он поставит куку с pid и отправит на /edit
    redirect(`/api/auth/switch?pid=${providers[0].id}`);
  }

  // Несколько профилей — показать список
  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Выберите профиль</h1>
        <a className="btn btn-success" href="/provider/new">
          <i className="bi bi-plus-lg me-1" />
          Создать новый
        </a>
      </div>

      <div className="row g-3">
        {providers.map((p) => (
          <div className="col-md-6 col-lg-4" key={p.id}>
            <div className="card-modern p-3 h-100 d-flex">
              <div className="d-flex align-items-center gap-3">
                <img
                  src={p.avatarUrl || 'https://picsum.photos/96'}
                  alt={p.name}
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div className="fw-semibold">{p.name}</div>
                  <div className="small text-secondary">{p.city || 'Город не указан'}</div>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <Link className="btn btn-outline-secondary btn-sm" href={`/provider/${p.id}`}>
                  <i className="bi bi-person me-1" /> Открыть
                </Link>
                {/* Свитчер выставит pid в куку и перекинет на /edit */}
                <a className="btn btn-primary btn-sm" href={`/api/auth/switch?pid=${p.id}`}>
                  <i className="bi bi-pencil-square me-1" /> Редактировать
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <a className="btn btn-outline-danger btn-sm" href="/auth/logout">
          <i className="bi bi-box-arrow-right me-1" />
          Выйти
        </a>
      </div>
    </div>
  );
}
