// src/app/admin/page.tsx
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 m-0">Админ-панель</h1>
      </div>

      <div className="row g-3">
        <div className="col-sm-6 col-lg-4">
          <Link href="/admin/providers" className="text-decoration-none d-block">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-people fs-4 me-2 text-primary" />
                  <h2 className="h5 m-0">Исполнители</h2>
                </div>
                <p className="text-secondary small mb-0">
                  Список, создание и редактирование исполнителей.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link href="/admin/categories" className="text-decoration-none d-block">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-list-ul fs-4 me-2 text-primary" />
                  <h2 className="h5 m-0">Категории</h2>
                </div>
                <p className="text-secondary small mb-0">
                  Древовидные категории (2 уровня) и SEO-поля.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-sm-6 col-lg-4">
          <Link href="/admin/categories/new" className="text-decoration-none d-block">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-plus-square fs-4 me-2 text-success" />
                  <h2 className="h5 m-0">Новая категория</h2>
                </div>
                <p className="text-secondary small mb-0">
                  Быстро создать категорию верхнего или второго уровня.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
