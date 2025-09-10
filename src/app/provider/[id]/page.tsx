// src/app/provider/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Gallery from '@/components/Gallery';
import { notFound } from 'next/navigation';
import QuoteModal from '@/components/QuoteModal';
import FavoriteButton from '@/components/FavoriteButton';

type Props = {
  params: Promise<{ id: string }>;
};

// Универсальное склонение: decl(3, ['проект','проекта','проектов'])
function decl(n: number, forms: [string, string, string]) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

/** ====== SEO-мета ====== */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idStr } = await params;

  if (!/^\d+$/.test(idStr)) return { title: 'Исполнитель не найден' };
  const id = Number(idStr);

  const p = await prisma.provider.findUnique({
    where: { id },
    include: {
      services: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      categories: { include: { category: true } },
      projects: {
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { sort: 'asc' } } },
      },
    },
  });

  if (!p) {
    return { title: 'Исполнитель не найден' };
  }

  const cat = p.categories?.[0]?.category?.name ?? 'Услуги';
  const serviceExample = p.services?.[0]?.name ?? '';
  const city = p.city ?? 'Россия';

  const title = `${p.name} — ${cat}${serviceExample ? ` (${serviceExample})` : ''} в ${city}`;
  const description = `Исполнитель «${p.name}» предлагает услуги по направлению «${cat}» в городе ${city}. 
Опыт — ${p.experienceYears ?? 1}+ лет, ${p.projects.length} ${decl(p.projects.length, ['проект', 'проекта', 'проектов'])} в портфолио. 
Свяжитесь напрямую и получите смету.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: p.avatarUrl ? [p.avatarUrl] : undefined,
    },
  };
}

export default async function ProviderPage({ params }: Props) {
  const { id: idStr } = await params;

  if (!/^\d+$/.test(idStr)) return notFound();
  const id = Number(idStr);

  const p = await prisma.provider.findUnique({
    where: { id },
    include: {
      services: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      categories: { include: { category: true } },
      projects: {
        orderBy: { id: 'desc' },
        include: { images: { orderBy: { sort: 'asc' } } },
      },
    },
  });

  if (!p) return notFound();

  const mainCat = p?.categories?.[0]?.category;
  const catHref = mainCat?.slug ? `/c/${encodeURIComponent(mainCat.slug)}` : '/c/all';
  const catTitle = mainCat?.name ?? 'Все исполнители';

  const nf = new Intl.NumberFormat('ru-RU');
  const price = (v?: number | null) => (v == null ? '—' : `${nf.format(v)} ₽`);
  const mainCategory = p.categories[0]?.category?.name ?? 'Исполнитель';
  const years =
    p.experienceYears && p.experienceYears > 0
      ? p.experienceYears
      : Math.max(1, new Date().getFullYear() - new Date(p.createdAt).getFullYear());
  const totalProjects = p.projects.length;

  return (
    <>
      {/* COVER */}
      <header
        className="py-4"
        style={{
          background:
            'radial-gradient(900px 420px at 15% -20%, rgba(13,110,253,.10), transparent 55%),' +
            'radial-gradient(700px 320px at 100% 0%, rgba(108,99,255,.12), transparent 60%),' +
            'linear-gradient(180deg,#fff 0%, #f6f9ff 100%)',
          borderBottom: '1px solid rgba(0,0,0,.06)',
        }}
      >
        <div className="container">
          {/* Хлебные крошки */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/" className="text-decoration-none text-secondary">Главная</a>
              </li>
              <li className="breadcrumb-item">
                <a href={catHref} className="text-decoration-none text-secondary">{catTitle}</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">{p.name}</li>
            </ol>
          </nav>

          {/* Шапка профиля */}
          <div
            className="p-3 p-md-4"
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,.06)',
              borderRadius: '1.2rem',
              boxShadow: '0 6px 22px rgba(0,0,0,.05)',
            }}
          >
            <div className="row g-4 align-items-center">
              <div className="col-auto">
                <img
                  src={
                    p.avatarUrl
                    || p.projects?.[0]?.images?.[0]?.url
                    || 'https://picsum.photos/200'
                  }
                  alt={p.name}
                  style={{
                    width: 96, height: 96, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid #fff',
                    boxShadow: '0 6px 16px rgba(0,0,0,.08)',
                  }}
                />
              </div>

              <div className="col">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <h1 className="h4 fw-bold mb-0">{p.name}</h1>
                  {p.isVerified && (
                    <span className="badge" style={{ background: '#f1f3f5', color: '#495057', border: '1px solid rgba(0,0,0,.06)' }}>
                      <i className="bi bi-patch-check-fill text-primary me-1" /> Проверенный
                    </span>
                  )}
                </div>

                <div className="small text-secondary mt-1 d-flex flex-wrap gap-3">
                  <span><i className="bi bi-geo-alt me-1" />{p.city || '—'}</span>
                  <span><i className="bi bi-briefcase me-1" />{p.title || 'Услуги'}</span>
                  {p.priceFrom != null && <span><i className="bi bi-cash-coin me-1" />от {price(p.priceFrom)}</span>}
                  {(p.rating ?? 0) > 0 && (
                    <span>
                      <i className="bi bi-star-fill text-warning me-1" />
                      {p.rating?.toFixed(1)}{p.reviewsCount ? ` • ${p.reviewsCount} отзывов` : ''}
                    </span>
                  )}
                </div>

                {(p.passportVerified || p.worksByContract) && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {p.passportVerified && (
                      <span className="badge bg-success-subtle text-success border">
                        <i className="bi bi-shield-check me-1" /> Паспорт проверен
                      </span>
                    )}
                    {p.worksByContract && (
                      <span className="badge bg-primary-subtle text-primary border">
                        <i className="bi bi-file-earmark-text me-1" /> По договору
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Действия */}
              <div className="col-lg-4">
                {/* место под действия */}
              </div>
            </div>

            {/* KPIs */}
            <div className="row g-3 mt-3">
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
                  <div className="fw-bold">{years} {decl(years, ['год', 'года', 'лет'])}</div>
                  <div className="small text-secondary">опыта</div>
                </div>
              </div>
            </div>

            {/* Якоря */}
            <div className="mt-3 d-flex flex-wrap gap-2">
              <a className="chip" href="#about"><i className="bi bi-info-circle" /> О компании</a>
              <a className="chip" href="#services"><i className="bi bi-card-checklist" /> Услуги и цены</a>
              <a className="chip" href="#portfolio"><i className="bi bi-images" /> Портфолио</a>
              {p.reviews.length > 0 && (
                <a className="chip" href="#reviews"><i className="bi bi-chat-left-text" /> Отзывы</a>
              )}
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
                    `Выполняем работы по направлению «${(mainCategory || 'услуги').toLowerCase()}». Сфокусированы на качестве, сроках и прозрачной смете. Работаем по договору, предоставляем отчёты по этапам.`}
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
                  <small className="text-secondary">Нажмите «Запросить смету» — и мы свяжемся с вами</small>
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
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#quoteModal"
                              data-service={s.name}
                            >
                              Запросить смету
                            </button>
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

              {/* PORTFOLIO */}
              <section id="portfolio" className="card-modern p-3 mb-3">
                <h2 className="h5 mb-3">Портфолио</h2>

                {p.projects.length > 0 ? (
                  <div className="vstack gap-4">
                    {p.projects.map(project => {
                      const imgs = Array.isArray(project.images) ? project.images : [];
                      return (
                        <div key={project.id}>
                          {project.title && <h3 className="h6 mb-2">{project.title}</h3>}

                          {imgs.length > 0 ? (
                            <Gallery
                              items={imgs.map(img => ({
                                src: img.url,
                                title: img.title || project.title || undefined,
                              }))}
                              showThumbs
                            />
                          ) : (
                            <div className="text-secondary small">Нет изображений</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-secondary">Пока нет примеров работ.</div>
                )}
              </section>

              {/* REVIEWS (если есть) */}
              {p.reviews.length > 0 && (
                <section id="reviews" className="card-modern p-3 mb-3">
                  <h2 className="h5 mb-3">Отзывы</h2>
                  <div className="vstack gap-3">
                    {p.reviews.map(r => (
                      <div key={r.id} className="border rounded p-2">
                        <div className="d-flex align-items-center mb-1">
                          <img
                            src={r.authorAvatar || `https://picsum.photos/seed/rev${r.id}/80`}
                            alt={r.authorName}
                            className="me-2"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div className="small">
                            <div className="fw-semibold">{r.authorName}</div>
                            <div className="text-secondary">
                              {[1,2,3,4,5].map(i => (
                                <i
                                  key={i}
                                  className={`bi ${r.rating >= i ? 'bi-star-fill text-warning' : 'bi-star'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="ms-auto small text-secondary">
                            {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div className="small">{r.text}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="col-lg-4">
              <div className="position-sticky" style={{ top: 84 }}>
                {/* Контакты / заявка */}
                <div id="contact" className="card-modern p-3 mb-3">
                  <h2 className="h6 mb-2">Связаться с исполнителем</h2>
                  <div className="small text-secondary mb-2">
                    Заполните форму в модальном окне — смету пришлём быстро.
                  </div>
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#quoteModal"
                    >
                      <i className="bi bi-send me-1" /> Запросить смету
                    </button>
                    <FavoriteButton
                      provider={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, city: p.city }}
                    />
                  </div>

                  <ul className="list-unstyled small text-secondary mb-0 mt-3">
                    <li className="mb-1"><i className="bi bi-geo-alt me-1 text-primary" /> {p.city || 'Россия'}</li>
                    {p.website && <li className="mb-1"><i className="bi bi-globe me-1 text-primary" /> {p.website}</li>}
                    {p.phone && <li className="mb-1"><i className="bi bi-telephone me-1 text-primary" /> {p.phone}</li>}
                    <li className="mb-1"><i className="bi bi-clock-history me-1 text-primary" /> Пн–Пт 10:00–19:00</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Модалка «Запросить смету» */}
        <QuoteModal providerId={p.id} providerName={p.name} />
      </main>
    </>
  );
}
