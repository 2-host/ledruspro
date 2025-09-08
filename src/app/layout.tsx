// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { verifyEditToken } from '@/lib/magic';
import LoginModal from '@/components/LoginModal';
import NewProviderNav from '@/components/NewProviderNav';
import FavoriteNavLink from '@/components/FavoriteNavLink';

export const metadata: Metadata = {
  title: 'LEDRUS PRO',
  description: 'Каталог исполнителей — Next.js + SQLite/Prisma',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // читаем сессию
  const c = await cookies();
  const token = c.get('edit_token')?.value;
  let email: string | null = null;
  let pid: number | null = null;
  if (token) {
    try {
      const payload = await verifyEditToken(token); // { email, pid? }
      email = payload.email;
      pid = typeof payload.pid === 'number' ? payload.pid : null;
    } catch {}
  }

  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      </head>
      <body>
        <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom">
          <div className="container py-2">
            <a className="navbar-brand fw-semibold" href="/">
              <i className="bi bi-stars me-2 text-primary"></i>LEDRUS PRO
            </a>

            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="nav">
              <ul className="navbar-nav ms-auto align-items-lg-center">
                <li className="nav-item me-lg-3">
                  <a className="nav-link link-muted" href="/c/all"><i className="bi bi-people me-1"></i> Исполнители</a>
                </li>
                 <li className="nav-item me-lg-3">
    <FavoriteNavLink />
  </li>
                {/* если НЕ авторизован */}
                {!email && (
                  <>
                    <li className="nav-item">
  {/* Показать либо "Войти", либо "Стать исполнителем" */}
  <NewProviderNav />
</li>
                  </>
                )}

                {/* если авторизован (есть email) */}
                {email && (
                  <>
                    <li className="nav-item me-lg-2">
                      <a className="btn btn-outline-primary" href="/provider/select">
                        <i className="bi bi-people me-1" /> Мои профили
                      </a>
                    </li>
                    <li className="nav-item me-lg-2 mt-2 mt-lg-0">
                        <a className="btn btn-primary" href={`/provider/new`}>
                          <i className="bi bi-pencil-square me-1" /> Создать профиль
                        </a>
                      </li>
                    <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                      <a className="btn btn-outline-danger" href="/api/auth/logout">
  <i className="bi bi-box-arrow-right me-1" /> Выйти{email ? ` (${email})` : ''}
</a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="py-4 bg-white border-top">
          <div className="container">
            
          </div>
        </footer>

        <LoginModal />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
      </body>
    </html>
  );
}
