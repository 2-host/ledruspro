// src/app/c/[...slugs]/page.tsx
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import FavoriteButton from '@/components/FavoriteButton';

/** ========= helpers ========= */

// Находим категорию по массиву сегментов URL (parent/child -> fullSlug)
// Возвращаем level/fullSlug/parentId — нужно для плиток навигации
async function findCategoryBySegments(segments: string[]) {
  if (!segments || segments.length === 0) return null;

  const decoded = segments.map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  const full = decoded.map(s => s.toLowerCase()).join('/');

  // 1) точное совпадение по fullSlug (parent/child)
  const byFull = await prisma.category.findFirst({
    where: { fullSlug: full },
    select: {
      id: true,
      name: true,
      level: true,
      fullSlug: true,
      parentId: true,
      seoH1: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
    },
  });
  if (byFull) return byFull;

  // 2) допускаем упрощённый slug/name ТОЛЬКО для одиночного сегмента
  if (segments.length === 1) {
    return prisma.category.findFirst({
      where: { OR: [{ slug: full }, { name: decoded[0] }] },
      select: {
        id: true,
        name: true,
        level: true,
        fullSlug: true,
        parentId: true,
        seoH1: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
      },
    });
  }

  return null;
}

// Генерация href для текущего пути с сохранением query-параметров (для пагинации/вида)
function buildHref(
  segments: string[],
  sp: Record<string, string | undefined>,
  overrides: Partial<{ page: number; view: 'grid' | 'list' }> = {}
) {
  const params = new URLSearchParams();
  if (sp.city) params.set('city', sp.city);
  if (sp.rating) params.set('rating', sp.rating);
  if (sp.q) params.set('q', sp.q);
  if (sp.passport) params.set('passport', sp.passport);
  if (sp.contract) params.set('contract', sp.contract);
  if (sp.view || overrides.view) params.set('view', (overrides.view || sp.view) as string);
  if (overrides.page && overrides.page > 1) params.set('page', String(overrides.page));
  else if (sp.page && (!overrides.page || overrides.page === Number(sp.page))) {
    const p = Number.parseInt(sp.page, 10);
    if (!Number.isNaN(p) && p > 1) params.set('page', String(p));
  }
  const qs = params.toString();
  const path = segments.length ? `/c/${segments.map(encodeURIComponent).join('/')}` : '/c/all';
  return `${path}${qs ? `?${qs}` : ''}`;
}

// Пагинация (с «…»)
function makePages(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total, total - 1, current, current - 1, current + 1]);
  const arr = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a,b)=>a-b);
  const out: (number | 'dots')[] = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push('dots');
  }
  return out;
}

// Триммер описаний
function truncateText(s: string | null | undefined, max = 500) {
  if (!s) return '';
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

const PER_PAGE = 8;

/** ========= SEO ========= */
type MetaParams = { params: Promise<{ slugs?: string[] }> };

export async function generateMetadata({ params }: MetaParams): Promise<Metadata> {
  const { slugs = [] } = await params;
  const isAll = slugs.length === 0 || (slugs.length === 1 && slugs[0].toLowerCase() === 'all');

  if (isAll) {
    return {
      title: 'Все исполнители',
      description: 'Каталог проверенных исполнителей по всем категориям.',
      keywords: 'исполнители, каталог, услуги',
    };
  }

  const cat = await findCategoryBySegments(slugs);
  const fallback = (() => {
    const last = slugs[slugs.length - 1] || 'Категория';
    try { return decodeURIComponent(last); } catch { return last; }
  })();

  return {
    title: cat?.seoTitle || (cat?.name ?? fallback),
    description:
      cat?.seoDescription ||
      `Исполнители категории «${cat?.name ?? fallback}». Сравните портфолио, цены и отзывы.`,
    keywords: cat?.seoKeywords || undefined,
  };
}

/** ========= Страница категории ========= */
type PageProps = {
  params: Promise<{ slugs?: string[] }>;
  searchParams: Promise<{
    city?: string;
    rating?: string;
    q?: string;
    view?: 'grid' | 'list';
    page?: string;
    passport?: string; // "1" | "true"
    contract?: string; // "1" | "true"
  }>;
};

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slugs = [] } = await params;
  const sp = await searchParams;

  const isAll = slugs.length === 0 || (slugs.length === 1 && slugs[0].toLowerCase() === 'all');
  const cat = isAll ? null : await findCategoryBySegments(slugs);

  // Родитель (если мы на 2-м уровне) — пригодится для «полки» и крошек
  let parent: { id: number; name: string; fullSlug: string } | null = null;
  if (cat?.level === 2 && cat.parentId) {
    parent = await prisma.category.findUnique({
      where: { id: cat.parentId },
      select: { id: true, name: true, fullSlug: true },
    });
  }

  // Навигационные категории (плитки): для level=1 — дети; для level=2 — сиблинги
  let navCats: { id: number; name: string; fullSlug: string }[] = [];
  let navTitle = '';

  if (cat) {
    if (cat.level === 1) {
      navCats = await prisma.category.findMany({
        where: { parentId: cat.id },
        select: { id: true, name: true, fullSlug: true },
        orderBy: { name: 'asc' },
      });
      if (navCats.length) navTitle = 'Подкатегории';
    } else if (cat.level === 2 && cat.parentId) {
      navCats = await prisma.category.findMany({
        where: { parentId: cat.parentId },
        select: { id: true, name: true, fullSlug: true },
        orderBy: { name: 'asc' },
      });
      if (navCats.length) navTitle = parent ? `Разделы — ${parent.name}` : 'Разделы';
    }
  }

  const rating = sp.rating ? parseFloat(sp.rating) : undefined;
  const passport = sp.passport === '1' || sp.passport === 'true';
  const contract = sp.contract === '1' || sp.contract === 'true';

  // формируем where
  const whereAND: any[] = [];
  if (cat) {
    // Если нужно, чтобы родитель тянул и детей — можно сделать IN по id детей+родителя.
    whereAND.push({ categories: { some: { categoryId: cat.id } } });
  }
  if (sp.city) whereAND.push({ city: { contains: sp.city } });
  if (rating) whereAND.push({ rating: { gte: rating } });

  if (sp.q) {
    const q = sp.q.toLowerCase();
    whereAND.push({
      OR: [
        { nameSearch:  { contains: q } },
        { titleSearch: { contains: q } },
        {
          services: {
            some: {
              OR: [
                { nameSearch:        { contains: q } },
                { descriptionSearch: { contains: q } },
              ],
            },
          },
        },
      ],
    });
  }
  if (passport) whereAND.push({ passportVerified: true });
  if (contract) whereAND.push({ worksByContract: true });

  // пагинация
  const pageParam = Number.parseInt(sp.page || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const skip = (page - 1) * PER_PAGE;

  const [totalCount, providers] = await Promise.all([
    prisma.provider.count({ where: { AND: whereAND } }),
    prisma.provider.findMany({
      where: { AND: whereAND },
      orderBy: { rating: 'desc' },
      include: { services: true, projects: true },
      take: PER_PAGE,
      skip,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const title = isAll
    ? 'Все исполнители'
    : (cat?.name ?? (() => { try { return decodeURIComponent(slugs[slugs.length-1] || 'Категория'); } catch { return slugs[slugs.length-1] || 'Категория'; } })());

  const h1 = isAll ? 'Все исполнители' : (cat?.seoH1 || title);
  const view: 'grid' | 'list' = sp.view === 'grid' || sp.view === 'list' ? sp.view : 'list';

  // диапазон отображаемых позиций
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const to = Math.min(currentPage * PER_PAGE, totalCount);

  // Хлебные крошки (метки по ИМЕНАМ, а не по slug-ам)
  const crumbs: { href: string; label: string }[] = [
    { href: '/', label: 'Главная' },
    { href: '/#categories', label: 'Категории' },
  ];
  if (isAll) {
    crumbs.push({ href: '/c/all', label: 'Все исполнители' });
  } else if (cat) {
    if (cat.level === 1) {
      crumbs.push({ href: `/c/${cat.fullSlug}`, label: cat.name });
    } else if (cat.level === 2) {
      if (parent) crumbs.push({ href: `/c/${parent.fullSlug}`, label: parent.name });
      crumbs.push({ href: `/c/${cat.fullSlug}`, label: cat.name });
    } else {
      // fallback по сегментам
      slugs.forEach((seg, i) => {
        const path = `/c/${slugs.slice(0, i + 1).map(encodeURIComponent).join('/')}`;
        const label = (() => { try { return decodeURIComponent(seg); } catch { return seg; } })();
        crumbs.push({ href: path, label });
      });
    }
  }

  // Текущий fullSlug — чтобы подсветить активную плитку
  const currentFull = slugs
    .map(s => { try { return decodeURIComponent(s); } catch { return s; } })
    .map(s => s.toLowerCase())
    .join('/');

  return (
    <>
      {/* SUBHERO / BREADCRUMBS */}
      <section className="subhero py-4">
        <div className="container">
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="breadcrumb mb-0">
              {crumbs.slice(0, -1).map((c, i) => (
                <li className="breadcrumb-item" key={i}>
                  <a href={c.href} className="link-muted text-decoration-none">{c.label}</a>
                </li>
              ))}
              <li className="breadcrumb-item active" aria-current="page">
                {crumbs[crumbs.length - 1]?.label || title}
              </li>
            </ol>
          </nav>

          <div className="row align-items-center g-3">
            <div className="col-lg-8">
              <h1 className="h2 fw-bold mb-1">{h1}</h1>
              <p className="text-secondary mb-0">
                Сравните портфолио, цены и отзывы — свяжитесь напрямую с подходящим исполнителем.
              </p>

              {/* Тематические теги (фиктивные) */}
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <span className="chip"><i className="bi bi-star me-1" /> Топ-рейтинг</span>
                <span className="chip"><i className="bi bi-clock me-1" /> Быстрые сроки</span>
                <span className="chip"><i className="bi bi-briefcase me-1" /> Коммерческие</span>
                <span className="chip"><i className="bi bi-house-door me-1" /> Жилые</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="py-5">
        <div className="container">
          {/* Полка подкатегорий / соседних разделов */}
          {navCats.length > 0 && (
            <section className="mb-4">
              <div className="d-flex align-items-end justify-content-between mb-3">
                <div>
                  <h2 className="h5 mb-1">{navTitle}</h2>
                  <small className="text-secondary">Выберите нужное направление</small>
                </div>
              </div>
              <div className="row g-3 g-md-4">
                {navCats.map((c) => {
                  const isActive = c.fullSlug.toLowerCase() === currentFull;
                  return (
                    <div className="col-6 col-md-4 col-lg-3" key={c.id}>
                      <a className="text-decoration-none d-block" href={`/c/${c.fullSlug}`}>
                        <div className={`tile ${isActive ? 'border border-primary' : ''}`}>
                          <i className="bi bi-collection text-primary" />
                          <div className="title mt-2">{c.name}</div>
                          <div className="muted">Перейти</div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="row g-4">
            {/* Sidebar */}
            <aside className="col-lg-3 order-lg-1">
              <div className="filter-card p-3 sticky">
                <h6 className="mb-3">Фильтры</h6>

                <form action="">
                  <div className="mb-3">
                    <label className="form-label small text-secondary">Город</label>
                    <input
                      className="form-control"
                      name="city"
                      placeholder="Например: Москва"
                      defaultValue={sp.city || ''}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary">Ключевые слова</label>
                    <input
                      className="form-control"
                      name="q"
                      placeholder="имя, навык, услуга…"
                      defaultValue={sp.q || ''}
                    />
                  </div>

                  <div className="mb-2 form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="passport"
                      name="passport"
                      value="1"
                      defaultChecked={sp.passport === '1' || sp.passport === 'true'}
                    />
                    <label className="form-check-label small" htmlFor="passport">
                      Паспорт проверен
                    </label>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="contract"
                      name="contract"
                      value="1"
                      defaultChecked={sp.contract === '1' || sp.contract === 'true'}
                    />
                    <label className="form-check-label small" htmlFor="contract">
                      Работает по договору
                    </label>
                  </div>

                  <div className="d-grid gap-2">
                    <button className="btn btn-primary btn-sm">
                      <i className="bi bi-funnel me-1" />
                      Применить
                    </button>
                    <a href={buildHref(slugs, {}, {})} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-arrow-repeat me-1" />
                      Сбросить
                    </a>
                  </div>
                </form>
              </div>
            </aside>

            {/* Results */}
            <section className="col-lg-9 order-lg-2">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="small text-secondary">
                  {totalCount > 0
                    ? <>Показано: <strong>{from}–{to}</strong> из <strong>{totalCount}</strong></>
                    : <>Ничего не найдено</>
                  }
                </div>

                {/* Переключатель вида */}
                <div className="btn-group" role="group" aria-label="Вид списка">
                  <a
                    href={buildHref(slugs, sp, { view: 'grid' })}
                    className={`btn btn-outline-secondary btn-sm ${view === 'grid' ? 'active' : ''}`}
                    title="Плитка"
                  >
                    <i className="bi bi-grid-3x3-gap" />
                  </a>
                  <a
                    href={buildHref(slugs, sp, { view: 'list' })}
                    className={`btn btn-outline-secondary btn-sm ${view === 'list' ? 'active' : ''}`}
                    title="Список"
                  >
                    <i className="bi bi-list" />
                  </a>
                </div>
              </div>

              {/* GRID VIEW */}
              {view === 'grid' && (
                <div className="row g-4">
                  {providers.map((p) => (
                    <div className="col-md-6" key={p.id}>
                      <div className="card-modern p-3 h-100">
                        <div className="d-flex align-items-center mb-3">
                          <img
                            className="avatar me-3"
                            src={
                              p.avatarUrl ||
                              // @ts-ignore: возможное поле из старой версии
                              p.projects?.[0]?.imageUrl ||
                              `https://picsum.photos/seed/ava${p.id}/140`
                            }
                            alt={p.name}
                          />
                          <div>
                            <div className="fw-semibold">{p.name}</div>
                            <div className="small text-secondary">
                              <i className="bi bi-geo-alt me-1" />
                              {p.city || '—'}
                              {p.services.length > 0 && (
                                <>
                                  {' '}• от{' '}
                                  {p.services[0].priceFrom
                                    ? p.services[0].priceFrom.toLocaleString('ru-RU')
                                    : '—'}{' '}
                                  ₽
                                </>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
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
                            {p.about && (
                              <div className="small text-muted mt-2">
                                {truncateText(p.about, 500)}
                              </div>
                            )}
                          </div>
                        </div>

                        <ul className="list-unstyled small text-secondary mb-3">
                          {(p.services || []).slice(0, 3).map((s) => (
                            <li key={s.id}>
                              <i className="bi bi-check2-circle me-2 text-success" />
                              {s.name}
                              {s.priceFrom ? ` — от ${s.priceFrom.toLocaleString('ru-RU')} ₽` : ''}
                            </li>
                          ))}
                        </ul>

                        <div className="d-flex align-items-center gap-2">
                          <a href={`/provider/${p.id}`} className="btn btn-primary flex-grow-1">
                            Смотреть профиль
                          </a>
                          <FavoriteButton provider={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, city: p.city }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LIST VIEW */}
              {view === 'list' && (
                <div className="vstack gap-3">
                  {providers.map((p) => (
                    <div className="card-modern p-3" key={p.id}>
                      <div className="d-flex gap-3 align-items-start">
                        <img
                          className="rounded object-fit-cover"
                          style={{ width: 88, height: 88 }}
                          src={
                            p.avatarUrl ||
                            // @ts-ignore
                            p.projects?.[0]?.imageUrl ||
                            `https://picsum.photos/seed/ava${p.id}/140`
                          }
                          alt={p.name}
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-start gap-2">
                            <div className="me-auto">
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold">{p.name}</span>
                                <span className="badge badge-soft">{p.title || 'Услуги'}</span>
                              </div>
                              <div className="small text-secondary mt-1">
                                <i className="bi bi-geo-alt me-1" />
                                {p.city || '—'}
                                {p.services.length > 0 && (
                                  <>
                                    {' '}• от{' '}
                                    {p.services[0].priceFrom
                                      ? p.services[0].priceFrom.toLocaleString('ru-RU')
                                      : '—'}{' '}
                                    ₽
                                  </>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
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
                            </div>

                            <div className="d-none d-md-flex align-items-center gap-2">
                              <a href={`/provider/${p.id}`} className="btn btn-primary">
                                Смотреть профиль
                              </a>
                              <FavoriteButton provider={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, city: p.city }} />
                            </div>
                          </div>

                          {p.about && (
                            <div className="small text-muted mt-2">{truncateText(p.about, 500)}</div>
                          )}

                          <ul className="list-unstyled small text-secondary mt-3 mb-0">
                            {(p.services || []).slice(0, 4).map((s) => (
                              <li key={s.id} className="mb-1">
                                <i className="bi bi-check2-circle me-2 text-success" />
                                {s.name}
                                {s.priceFrom ? ` — от ${s.priceFrom.toLocaleString('ru-RU')} ₽` : ''}
                              </li>
                            ))}
                          </ul>

                          <div className="d-md-none d-flex align-items-center gap-2 mt-3">
                            <a href={`/provider/${p.id}`} className="btn btn-primary flex-grow-1">
                              Смотреть профиль
                            </a>
                            <FavoriteButton provider={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, city: p.city }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalCount === 0 && (
                <div className="alert alert-light border mt-3">
                  По вашему запросу ничего не найдено.
                </div>
              )}

              {/* Пагинация */}
              {totalPages > 1 && (
                <nav className="mt-4" aria-label="Навигация по страницам">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <a
                        className="page-link"
                        href={buildHref(slugs, sp, { page: currentPage - 1 })}
                        aria-label="Назад"
                      >
                        Назад
                      </a>
                    </li>

                    {makePages(currentPage, totalPages).map((p, idx) =>
                      p === 'dots' ? (
                        <li key={`dots-${idx}`} className="page-item disabled">
                          <a className="page-link">…</a>
                        </li>
                      ) : (
                        <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                          <a className="page-link" href={buildHref(slugs, sp, { page: p })}>{p}</a>
                        </li>
                      )
                    )}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a
                        className="page-link"
                        href={buildHref(slugs, sp, { page: currentPage + 1 })}
                        aria-label="Вперёд"
                      >
                        Вперёд
                      </a>
                    </li>
                  </ul>
                </nav>
              )}

              {/* SEO-блок */}
              <section className="mt-5">
                <h2 className="h4 mb-3">О категории «{title}»</h2>
                <p className="text-secondary">
                  В каталоге собраны проверенные исполнители. Сравнивайте по портфолио,
                  стоимости пакетов и отзывам, чтобы выбрать оптимального подрядчика под ваш бюджет и сроки.
                </p>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="filter-card p-3 h-100">
                      <div className="fw-semibold mb-1">
                        <i className="bi bi-clipboard-check me-1 text-primary" />
                        Что обычно входит
                      </div>
                      <ul className="list-unstyled small text-secondary mb-0">
                        <li>Консультация и ТЗ</li>
                        <li>Проектные решения</li>
                        <li>Смета/коммерческое предложение</li>
                        <li>Авторское сопровождение</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="filter-card p-3 h-100">
                      <div className="fw-semibold mb-1">
                        <i className="bi bi-cash-coin me-1 text-primary" />
                        Как формируется цена
                      </div>
                      <ul className="list-unstyled small text-secondary mb-0">
                        <li>Сложность и объём работ</li>
                        <li>Сроки выполнения</li>
                        <li>Опыт исполнителя</li>
                        <li>Требуемые материалы/ПО</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="filter-card p-3 h-100">
                      <div className="fw-semibold mb-1">
                        <i className="bi bi-patch-check me-1 text-primary" />
                        Как выбрать
                      </div>
                      <ul className="list-unstyled small text-secondary mb-0">
                        <li>Сопоставьте стиль и референсы</li>
                        <li>Запросите 2–3 КП</li>
                        <li>Проверьте договор и этапы</li>
                        <li>Читайте отзывы с фото</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
