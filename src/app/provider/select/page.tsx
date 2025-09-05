// src/app/provider/select/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';

const COOKIE_TOKEN = 'edit_token';
const COOKIE_EMAIL = 'email';

export default async function ProviderSelectPage() {
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

  const rows = await prisma.provider.findMany({
    where: { ownerEmail: email },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">Выберите профиль</h1>
      <ul className="list-unstyled">
        {rows.map(p => (
          <li key={p.id} className="mb-2">
            <Link className="btn btn-outline-primary btn-sm" href={`/provider/${p.id}/edit`}>
              Редактировать «{p.name ?? `#${p.id}`}»
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
