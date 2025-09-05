import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" href="/admin/providers">Admin</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="adminNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link" href="/admin/providers">Исполнители</Link></li>
              <li className="nav-item"><Link className="nav-link" href="/admin/categories">Категории</Link></li>
            </ul>
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