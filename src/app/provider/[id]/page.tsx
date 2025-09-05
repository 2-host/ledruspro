// src/app/provider/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import Gallery from '@/components/Gallery';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>; // <-- params как Promise
};

// Универсальное склонение: decl(3, ['проект','проекта','проектов'])
function decl(n: number, forms: [string, string, string]) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

export default async function ProviderPage({ params }: Props) {
  const { id: idStr } = await params; // <-- ОБЯЗАТЕЛЬНО await

  // если сегмент не число (например /provider/edit) — 404
  if (!/^\d+$/.test(idStr)) return notFound();

  const id = Number(idStr);

  const p = await prisma.provider.findUnique({
    where: { id },
    include: {
      services: true,
      projects: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      categories: { include: { category: true } },
    },
  });

  if (!p) return notFound();

  const nf = new Intl.NumberFormat('ru-RU');
  const price = (v?: number | null) => (v == null ? '—' : `${nf.format(v)} ₽`);
  const stars = (val: number) =>
    [1, 2, 3, 4, 5].map(i => (
      <i
        key={i}
        className={`bi ${val >= i ? 'bi-star-fill' : val >= i - 0.5 ? 'bi-star-half' : 'bi-star'}`}
      />
    ));

  const mainCategory = p.categories[0]?.category?.name ?? 'Исполнитель';
  const years =
    p.experienceYears && p.experienceYears > 0
      ? p.experienceYears
      : Math.max(1, new Date().getFullYear() - new Date(p.createdAt).getFullYear());

  // кол-во проектов = кол-ву работ в портфолио
  const totalProjects = p.projects.length;

  return (
    <>
      {/* COVER / HEADER */}
      <header
        className="py-4"
        style={{
          background:
            'radial-gradient(800px 400px at 20% -20%, rgba(13,110,253,.10), transparent 50%),' +
            'radial-gradient(600px 300px at 100% 0%, rgba(108,99,255,.12), transparent 60%),' +
            'linear-gradient(180deg,#fff 0%, #f6f9ff 100%)',
          borderBottom: '1px solid rgba(0,0,0,.06)',
        }}
      >
        <div className="container">
          {/* Хлебные крошки */}
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/" className="text-decoration-none text-secondary">Главная</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/#categories" className="text-decoration-none text-secondary">
                  {mainCategory}
                </a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {p.name}
              </li>
            </ol>
          </nav>

          <div
            className="p-3 p-md-4"
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,.06)',
              borderRadius: '1.2rem',
              boxShadow: '0 6px 22px rgba(0,0,0,.05)',
            }}
          >
            <div className="row g-3 align-items-center">
              <div className="col-auto">
                <img
                  className="avatar-xl"
                  src={p.avatarUrl || p.projects?.[0]?.imageUrl || 'https://picsum.photos/200'}
                  alt={p.name}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #fff',
                    boxShadow: '0 6px 16px rgba(0,0,0,.08)',
                  }}
                />
              </div>

              <div className="col">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <h1 className="h4 fw-bold mb-0">{p.name}</h1>
                  {p.isVerified ? (
                    <span className="badge" style={{ background: '#f1f3f5', color: '#495057', border: '1px solid rgba(0,0,0,.06)' }}>
                      <i className="bi bi-patch-check-fill text-primary me-1" /> Проверенный
                    </span>
                  ) : null}
                </div>

                <div className="d-flex flex-wrap gap-3 small text-secondary mt-1">
                  <span><i className="bi bi-geo-alt me-1" />{p.city || '—'}</span>
                  <span><i className="bi bi-briefcase me-1" />{p.title || 'Услуги'}</span>
                  {p.priceFrom != null && (
                    <span><i className="bi bi-cash-coin me-1" />от {price(p.priceFrom)}</span>
                  )}
                </div>

                {/* Статусы доверия */}
                {(p.passportVerified || p.worksByContract) && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {p.passportVerified && (
                      <span className="badge bg-success-subtle text-success border" title="Документы проверены модератором">
                        <i className="bi bi-shield-check me-1" /> Паспорт проверен
                      </span>
                    )}
                    {p.worksByContract && (
                      <span className="badge bg-primary-subtle text-primary border" title="Готов заключать договор подряда">
                        <i className="bi bi-file-earmark-text me-1" /> По договору
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="col-lg-4">
                <div className="row g-2">
                  <div className="col-6 col-lg-12 d-grid">
                    <a href="#contact" className="btn btn-primary">
                      <i className="bi bi-chat-dots me-1" /> Написать
                    </a>
                  </div>
                  <div className="col-6 col-lg-12 d-grid">
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-heart me-1" /> В избранное
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="row g-3 mt-2">
              <div className="col-6 col-md-3">
                <div className="kpi">
                  <div className="fw-bold">{totalProjects}</div>
                  <div className="small text-secondary">
                    {decl(totalProjects, ['проект', 'проекта', 'проектов'])}
                  </div>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="kpi">
                  <div className="fw-bold">
                    {years} {decl(years, ['год', 'года', 'лет'])}
                  </div>
                  <div className="small text-secondary">опыта</div>
                </div>
              </div>
            </div>

            {/* Якорное меню */}
            <div className="mt-3 d-flex flex-wrap gap-2">
              <a className="chip" href="#about"><i className="bi bi-info-circle" /> О компании</a>
              <a className="chip" href="#services"><i className="bi bi-card-checklist" /> Услуги и цены</a>
              <a className="chip" href="#portfolio"><i className="bi bi-images" /> Портфолио</a>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="py-4">
        <div className="container">
          <div className="row g-4">
            {/* CONTENT */}
            <div className="col-lg-8">
              {/* ABOUT */}
              <section id="about" className="card-modern p-3 mb-3">
                <h2 className="h5 mb-2">О компании</h2>
                <p className="text-secondary mb-0">
                  {p.about?.trim() ||
                    `Выполняем работы по направлению «${mainCategory.toLowerCase()}». Сфокусированы на качестве, сроках и прозрачной смете. Работаем по договору, предоставляем отчёты по этапам.`}
                </p>
                {!!p.categories.length && (
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    {p.categories.map(pc => (
                      <span key={pc.id} className="badge bg-light text-secondary border">
                        {pc.category.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* SERVICES */}
              <section id="services" className="card-modern p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h2 className="h5 mb-0">Услуги и цены</h2>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Услуга</th>
                        <th className="text-nowrap">Цена от</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.services.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div className="fw-semibold">{s.name}</div>
                            {s.description && (
                              <div className="small text-secondary">{s.description}</div>
                            )}
                          </td>
                          <td className="text-nowrap">
                            {price(s.priceFrom)} {s.unit ? `/${s.unit}` : ''}
                          </td>
                          <td className="text-end">
                            <a href="#contact" className="btn btn-sm btn-primary">
                              Запросить смету
                            </a>
                          </td>
                        </tr>
                      ))}
                      {p.services.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-secondary">Услуги не указаны</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* PORTФОЛИО */}
              <section id="portfolio" className="card-modern p-3 mb-3">
                <h2 className="h5 mb-3">Портфолио</h2>
                {p.projects.length > 0 ? (
                  <Gallery
                    items={p.projects.map(pr => ({
                      src: pr.imageUrl,
                      title: pr.title || undefined,
                    }))}
                  />
                ) : (
                  <div className="text-secondary">Пока нет примеров работ.</div>
                )}
              </section>
            </div>

            {/* SIDEBAR */}
            <aside className="col-lg-4">
              <div className="position-sticky" style={{ top: 84 }}>
                <div id="contact" className="card-modern p-3 mb-3">
                  <h2 className="h6 mb-2">Связаться с исполнителем</h2>
                  <form>
                    <div className="mb-2">
                      <input className="form-control" placeholder="Ваше имя" />
                    </div>
                    <div className="mb-2">
                      <input className="form-control" placeholder="Телефон или email" />
                    </div>
                    <div className="mb-2">
                      <textarea className="form-control" rows={3} placeholder="Кратко о задаче" />
                    </div>
                    <div className="d-grid">
                      <button className="btn btn-primary" type="button">
                        <i className="bi bi-send me-1" /> Отправить заявку
                      </button>
                    </div>
                    <div className="form-text mt-2">
                      Отправляя, вы соглашаетесь с условиями сервиса.
                    </div>
                  </form>
                </div>

                <div className="card-modern p-3 mb-3">
                  <h2 className="h6 mb-2">Информация</h2>
                  <ul className="list-unstyled small text-secondary mb-0">
                    <li className="mb-1"><i className="bi bi-geo-alt me-1 text-primary" /> {p.city || 'Россия'}</li>
                    {p.website && <li className="mb-1"><i className="bi bi-globe me-1 text-primary" /> {p.website}</li>}
                    {p.phone && <li className="mb-1"><i className="bi bi-telephone me-1 text-primary" /> {p.phone}</li>}
                    <li className="mb-1"><i className="bi bi-clock-history me-1 text-primary" /> Пн–Пт 10:00–19:00</li>
                  </ul>
                </div>

                <div className="card-modern p-2">
                  <div className="ratio ratio-16x9 rounded overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=1200&auto=format&fit=crop"
                      className="w-100 h-100 object-fit-cover"
                      alt="map placeholder"
                    />
                  </div>
                  <div className="small text-secondary p-2">
                    Зона обслуживания: {p.city || 'Россия'}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
