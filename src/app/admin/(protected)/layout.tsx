// app/admin/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionSecret } from '@/src/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = cookies(); // в серверных компонентов это синхронно
  const sess = c.get('admin_session')?.value ?? null;
  const ok = !!sess && sess === getSessionSecret();

  if (!ok) {
    redirect('/admin/login?from=/admin');
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" href="/admin">Admin</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="adminNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link" href="/admin/providers">Исполнители</Link></li>
              <li className="nav-item"><Link className="nav-link" href="/admin/categories">Категории</Link></li>
            </ul>
            <form action="/api/admin/logout" method="post">
              <button className="btn btn-outline-light btn-sm">Выйти</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="bg-light border-bottom">
        <div className="container py-2 text-muted small">Панель управления</div>
      </div>
      {children}
      <footer className="border-top py-4 mt-5">
        <div className="container text-muted small">© Admin</div>
      </footer>
    </div>
  );
}
