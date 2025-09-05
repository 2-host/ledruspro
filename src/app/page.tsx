// src/app/page.tsx
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  // Данные из БД
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    take: 6,
  });

  const topProviders = await prisma.provider.findMany({
    orderBy: { rating: 'desc' },
    take: 3,
    include: { services: true, projects: true },
  });

  return (
    <>
      {/* HERO */}
      <header className="hero py-5 py-lg-6">
        <div className="container py-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <h1 className="display-5 fw-bold mb-3">
                Найдите проверенного исполнителя для вашего проекта
              </h1>
              <p className="lead text-secondary mb-4">
                Дизайнеры, светотехники, инженеры-проектировщики, электрики,
                монтажники, потолочники — всё в одном каталоге. С ценами, портфолио и отзывами.
              </p>

              <form className="search p-3 p-sm-4 mb-3" action="/c/all">
                <div className="row g-2 g-sm-3 align-items-center">
                  <div className="col-12 col-md-5">
                    <div className="input-group">
                      <span className="input-group-text bg-transparent border-0">
                        <i className="bi bi-search text-secondary" />
                      </span>
                      <input
                        className="form-control bg-transparent border-0"
                        name="q"
                        placeholder="Что нужно сделать? (например, дизайн интерьера)"
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="input-group">
                      <span className="input-group-text bg-transparent border-0">
                        <i className="bi bi-geo-alt text-secondary" />
                      </span>
                      <input
                        className="form-control bg-transparent border-0"
                        name="city"
                        placeholder="Город или регион"
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-3 d-grid">
                    <button className="btn btn-primary">
                      <i className="bi bi-funnel me-1" /> Найти
                    </button>
                  </div>
                </div>
              </form>

              <div className="d-flex gap-2 flex-wrap small">
                <span className="text-secondary">Популярное:</span>
                <a href="/c/designers" className="chip">
                  <i className="bi bi-palette2 text-warning" /> Дизайн интерьера
                </a>
                <a href="/c/lighting" className="chip">
                  <i className="bi bi-lightbulb text-info" /> Проект освещения
                </a>
                <a href="/c/electricians" className="chip">
                  <i className="bi bi-lightning-charge text-warning" /> Электромонтаж
                </a>
                <a href="/c/ceilings" className="chip">
                  <i className="bi bi-building" /> Натяжные потолки
                </a>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="ratio ratio-4x3 rounded-4 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop"
                  alt="portfolio"
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CATEGORIES */}
      <section id="categories" className="py-5">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <h2 className="h3 mb-1">Категории</h2>
              <small className="text-secondary">Выберите направление работ</small>
            </div>
            <a href="/c/all" className="btn btn-outline-primary btn-sm">
              Все категории <i className="bi bi-chevron-right" />
            </a>
          </div>

          <div className="row g-3 g-md-4">
            {categories.map((c) => (
              <div className="col-6 col-md-4 col-lg-3" key={c.id}>
                <a className="text-decoration-none" href={`/c/${c.slug}`}>
                  <div className="tile">
                    <i className="bi bi-collection text-primary" />
                    <div className="title mt-2">{c.name}</div>
                    <div className="muted">Перейти</div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROVIDERS */}
      <section id="providers" className="py-5">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <h2 className="h3 mb-1">Топ-исполнители рядом с вами</h2>
              <small className="text-secondary">По рейтингу и отзывам</small>
            </div>
            <a href="/c/all" className="btn btn-outline-primary btn-sm">
              Смотреть всех <i className="bi bi-chevron-right" />
            </a>
          </div>

          <div className="row g-4">
            {topProviders.map((p) => (
              <div className="col-md-6 col-lg-4" key={p.id}>
                <div className="card-modern h-100 p-3">
                  <div className="d-flex align-items-center mb-3">
                    <img
  className="avatar me-3"
  src={p.avatarUrl || p.projects?.[0]?.imageUrl || 'https://picsum.photos/140'}
  alt={p.name}
/>
                    <div>
                      <div className="fw-semibold">{p.name}</div>
                      <div className="small text-secondary">
                        <i className="bi bi-geo-alt me-1" />
                        {p.city || '—'}
                      </div>
                    </div>
                   <span className="ms-auto badge badge-soft">
  {p.title || 'Услуги'}
</span>
                  </div>

                  <div className="rating mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i
                        key={i}
                        className={`bi ${
                          (p.rating || 0) >= i
                            ? 'bi-star-fill'
                            : (p.rating || 0) >= i - 0.5
                            ? 'bi-star-half'
                            : 'bi-star'
                        }`}
                      />
                    ))}
                    <span className="small text-secondary ms-1">
                      {(p.rating || 0).toFixed(1)} ({p.reviewsCount || 0})
                    </span>
                  </div>

                  <ul className="list-unstyled small text-secondary mb-3">
                    {(p.services || []).slice(0, 3).map((s, idx) => (
                      <li key={idx}>
                        <i className="bi bi-check2-circle me-2 text-success" />
                        {s.name}
                        {s.priceFrom ? ` от ${s.priceFrom.toLocaleString('ru-RU')} ₽` : ''}
                      </li>
                    ))}
                  </ul>

                  <div className="d-flex align-items-center gap-2">
                    <a href={`/provider/${p.id}`} className="btn btn-primary flex-grow-1">
                      Смотреть профиль
                    </a>
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-heart" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* HOW IT WORKS + CTA (из макета) */}
<section id="how" className="py-5">
  <div className="container">
    <div className="row align-items-center g-4">
      <div className="col-lg-5">
        <h2 className="h3 mb-3">Как это работает</h2>
        <p className="text-secondary">
          Найдите нужного специалиста, сравните цены и портфолио, свяжитесь напрямую и договоритесь о работах.
        </p>
        <ul className="list-unstyled">
          <li className="d-flex gap-3 align-items-start mb-3">
            <div className="fs-4 text-primary"><i className="bi bi-search" /></div>
            <div>
              <div className="fw-semibold">1. Поиск</div>
              <div className="text-secondary small">Фильтры по категории, городу, цене и рейтингу.</div>
            </div>
          </li>
          <li className="d-flex gap-3 align-items-start mb-3">
            <div className="fs-4 text-primary"><i className="bi bi-collection" /></div>
            <div>
              <div className="fw-semibold">2. Сравнение</div>
              <div className="text-secondary small">Смотрите портфолио, цены и отзывы реальных клиентов.</div>
            </div>
          </li>
          <li className="d-flex gap-3 align-items-start">
            <div className="fs-4 text-primary"><i className="bi bi-chat-dots" /></div>
            <div>
              <div className="fw-semibold">3. Контакт</div>
              <div className="text-secondary small">Связывайтесь напрямую и договаривайтесь о проекте.</div>
            </div>
          </li>
        </ul>
      </div>

      <div className="col-lg-7">
        <div className="row g-3">
          <div className="col-6"><div className="kpi"><div className="value">2 500+</div><div className="label">исполнителей</div></div></div>
          <div className="col-6"><div className="kpi"><div className="value">18 000+</div><div className="label">успешных проектов</div></div></div>
          <div className="col-6"><div className="kpi"><div className="value">4.6</div><div className="label">средний рейтинг</div></div></div>
          <div className="col-6"><div className="kpi"><div className="value">24/7</div><div className="label">поддержка</div></div></div>
        </div>
      </div>
    </div>

    {/* CTA в той же секции */}
    <div className="cta mt-4 p-4 p-md-5">
      <div className="row align-items-center g-3">
        <div className="col-md">
          <h3 className="h4 mb-1">Вы — исполнитель?</h3>
          <div className="text-secondary">Подключайтесь к каталогу и получайте заявки от клиентов.</div>
        </div>
        <div className="col-md-auto">
          <a href="#register" className="btn btn-primary">
            <i className="bi bi-building-add me-1"></i> Стать исполнителем
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
    </>
  );
}
