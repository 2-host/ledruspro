import Link from 'next/link';

export default function AdminHome() {
  return (
    <main className="container py-4">
      <h1 className="h3 mb-4">Админ-панель</h1>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card card-body">
            <h5 className="mb-2">Исполнители</h5>
            <p className="text-secondary small mb-3">Добавление и редактирование карточек исполнителей.</p>
            <Link href="/admin/providers" className="btn btn-primary btn-sm">Открыть</Link>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card card-body">
            <h5 className="mb-2">Категории</h5>
            <p className="text-secondary small mb-3">Управление категориями и подкатегориями.</p>
            <Link href="/admin/categories" className="btn btn-primary btn-sm">Открыть</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
