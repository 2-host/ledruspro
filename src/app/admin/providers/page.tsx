import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteButton from './ui/DeleteButton';

export const dynamic = 'force-dynamic';

function toInt(v: string | string[] | undefined, d: number) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) ? n : d;
}

export default async function AdminProvidersPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const q = (searchParams?.q as string)?.trim() || '';
  const page = Math.max(1, toInt(searchParams?.page, 1));
  const take = 50;
  const skip = (page - 1) * take;

  const where = q ? {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q } },
    ],
  } : {};

  const [items, total] = await Promise.all([
    prisma.provider.findMany({ where, orderBy: { id: 'desc' }, skip, take, include: { categories: { include: { category: true } } } }),
    prisma.provider.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 m-0">Исполнители</h1>
        <form className="d-flex" action="/admin/providers" method="get">
          <input name="q" defaultValue={q} className="form-control me-2" placeholder="Поиск: имя, город, slug" />
          <button className="btn btn-primary" type="submit"><i className="bi bi-search me-1"/>Искать</button>
        </form>
      </div>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Категории</th>
              <th>Город</th>
              <th>Телефон</th>
              <th>Прайс от</th>
              <th>Проверен</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><Link href={`/admin/providers/${p.id}/edit`}>{p.name}</Link></td>
                <td className="text-nowrap text-truncate" style={{maxWidth: 220}}>
                  {p.categories.map(pc => pc.category.name).join(', ') || '—'}
                </td>
                <td>{p.city || '—'}</td>
                <td>{p.phone || '—'}</td>
                <td>{p.priceFrom ?? '—'}</td>
                <td>{p.isVerified ? '✅' : '—'}</td>
                <td className="text-end">
                  <Link href={`/admin/providers/${p.id}/edit`} className="btn btn-sm btn-outline-secondary me-2"><i className="bi bi-pencil"/> Edit</Link>
                  <DeleteButton id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Навигация страниц">
        <ul className="pagination">
          {Array.from({ length: pages }).map((_, i) => (
            <li key={i} className={`page-item ${i + 1 === page ? 'active' : ''}`}>
              <Link className="page-link" href={`/admin/providers?page=${i + 1}&q=${encodeURIComponent(q)}`}>{i + 1}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}