// src/app/provider/select/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';

const COOKIE_TOKEN = 'edit_token';
const COOKIE_EMAIL = 'email';

type Row = {
  id: number;
  name: string | null;
  city: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  isVerified: boolean | null;
};

function initials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map(p => p[0]?.toUpperCase() ?? '').join('');
  return chars || '??';
}

export default async function ProviderSelectPage() {
  // auth как было
  const c = await cookies();
  const token = c.get(COOKIE_TOKEN)?.value || null;
  const emailCookie = c.get(COOKIE_EMAIL)?.value?.toLowerCase().trim() || null;
  if (!token) redirect('/?login=required&return=/provider/select');

  let email = emailCookie;
  try {
    const payload = await verifyEditToken(token!);
    email = (payload?.email && String(payload.email).toLowerCase().trim()) || email;
  } catch {
    redirect('/?login=required&return=/provider/select');
  }
  if (!email) redirect('/?login=required&return=/provider/select');

  // просто получаем свои профили, без поиска
  const rows = (await prisma.provider.findMany({
    where: { ownerEmail: email },
    select: {
      id: true,
      name: true,
      city: true,
      avatarUrl: true,
      rating: true,
      reviewsCount: true,
      isVerified: true,
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
  })) as Row[];

  const total = rows.length;

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Мои исполнители</h1>
          <div className="text-muted">
            {total === 0 ? 'Нет профилей' : `Профилей: ${total}`}
          </div>
        </div>
        <Link href="/provider/new" className="btn btn-primary">
          + Добавить исполнителя
        </Link>
      </div>

      {total === 0 ? (
        <div className="text-center py-5 border rounded-3 bg-light">
          <div className="fs-5 mb-2">Вы ещё не добавили ни одного исполнителя</div>
          <p className="text-muted mb-3">
            Нажмите «Добавить исполнителя», чтобы создать профиль и заполнить информацию.
          </p>
          <Link href="/provider/new" className="btn btn-primary">
            Создать профиль
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {rows.map((p) => (
            <div key={p.id} className="col-12 col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex gap-3">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name ?? `#${p.id}`}
                      width={56}
                      height={56}
                      className="rounded-circle flex-shrink-0"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-light border d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 56, height: 56, fontWeight: 600 }}
                      aria-label="Аватар-заглушка"
                    >
                      {initials(p.name)}
                    </div>
                  )}

                  <div className="flex-grow-1 d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h2 className="h6 mb-0">
                        {p.name ?? <span className="text-muted">Без названия</span>}
                      </h2>
                      {p.isVerified ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          ✓ Проверен
                        </span>
                      ) : null}
                    </div>

                    <div className="small text-muted mb-2">
                      {p.city || 'Город не указан'} {' • '}
                      ★ {typeof p.rating === 'number' ? p.rating.toFixed(1) : '—'} {' · '}
                      {typeof p.reviewsCount === 'number' ? p.reviewsCount : 0} отзыв(ов)
                    </div>

                    <div className="mt-auto d-flex gap-2">
                      <Link href={`/provider/${p.id}/edit`} className="btn btn-primary btn-sm">
                        Редактировать
                      </Link>
                      <Link href={`/provider/${p.id}`} className="btn btn-outline-secondary btn-sm">
                        Открыть
                      </Link>
                      <span className="ms-auto small text-muted align-self-center">#{p.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
