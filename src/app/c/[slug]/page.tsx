// src/app/c/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ slug: string }>;
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

// транслит кириллицы → латиница под слуги
const translitMap: Record<string, string> = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z', и:'i', й:'y',
  к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f',
  х:'h', ц:'ts', ч:'ch', ш:'sh', щ:'sch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya',
};
function translit(input: string) {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => translitMap[ch] ?? ch)
    .join('');
}
function slugify(input: string) {
  return translit(input)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const PER_PAGE = 5;

function truncateText(s: string | null | undefined, max = 500) {
  if (!s) return '';
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

// Собираем href с сохранением фильтров/вида и возможной заменой page
function buildHref(
  rawSlug: string,
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
  return `/c/${rawSlug}${qs ? `?${qs}` : ''}`;
}

// Диапазон номеров страниц (с «…»)
function makePages(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>();
  pages.add(1);
  pages.add(2);
  pages.add(total);
  pages.add(total - 1);
  pages.add(current);
  pages.add(current - 1);
  pages.add(current + 1);
  const arr = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a,b)=>a-b);
  const withDots: (number | 'dots')[] = [];
  for (let i = 0; i < arr.length; i++) {
    withDots.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) withDots.push('dots');
  }
  return withDots;
}

/** ====== ВАЖНО: generateMetadata на верхнем уровне модуля ====== */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: rawSlug } = await params;

  let decoded = rawSlug;
  try { decoded = decodeURIComponent(rawSlug); } catch {}

  const isLatin = /^[a-z0-9-]+$/i.test(decoded);
  const latinCandidate = isLatin ? decoded.toLowerCase() : slugify(decoded);
  const isAll = latinCandidate === 'all' || decoded.toLowerCase() === 'all';

  if (isAll) {
    return {
      title: 'Все исполнители',
      description: 'Каталог проверенных исполнителей по всем категориям.',
      keywords: 'исполнители, каталог, услуги',
    };
  }

  const cat = await prisma.category.findFirst({
    where: { OR: [{ slug: latinCandidate }, { name: decoded }] },
    select: { name: true, seoTitle: true, seoDescription: true, seoKeywords: true },
  });

  const fallbackTitle = cat?.name ?? decoded;

  return {
    title: cat?.seoTitle || fallbackTitle,
    description:
      cat?.seoDescription ||
      `Исполнители категории «${fallbackTitle}». Сравните портфолио, цены и отзывы.`,
    keywords: cat?.seoKeywords || undefined,
  };
}

/** ====== Страница категории ====== */
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  const sp = await searchParams;

  let decoded = rawSlug;
  try { decoded = decodeURIComponent(rawSlug); } catch {}

  const isLatin = /^[a-z0-9-]+$/i.test(decoded);
  const latinCandidate = isLatin ? decoded.toLowerCase() : slugify(decoded);
  const isAll = latinCandidate === 'all' || decoded.toLowerCase() === 'all';

  const cat = !isAll
    ? await prisma.category.findFirst({
        where: { OR: [{ slug: latinCandidate }, { name: decoded }] },
        select: { id: true, name: true, seoH1: true },
      })
    : null;

  const rating = sp.rating ? parseFloat(sp.rating) : undefined;
  const passport = sp.passport === '1' || sp.passport === 'true';
  const contract = sp.contract === '1' || sp.contract === 'true';

  // формируем where
  const whereAND: any[] = [];
  if (cat) whereAND.push({ categories: { some: { categoryId: cat.id } } });
  if (sp.city) whereAND.push({ city: { contains: sp.city } });
  if (rating) whereAND.push({ rating: { gte: rating } });
  if (sp.q) {
    whereAND.push({
      OR: [{ name: { contains: sp.q } }, { title: { contains: sp.q } }],
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
  const title = isAll ? 'Все исполнители' : (cat?.name ?? decoded);
  const h1 = isAll ? 'Все исполнители' : (cat?.seoH1 || title);

  // текущий вид (по умолчанию LIST)
  const view: 'grid' | 'list' = sp.view === 'grid' || sp.view === 'list' ? sp.view : 'list';

  // диапазон отображаемых позиций
  const from = totalCount === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const to = Math.min(currentPage * PER_PAGE, totalCount);

  return (
    <>
      {/* SUBHERO / BREADCRUMBS */}
      <section className="subhero py-4">
        <div className="container">
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/" className="link-muted text-decoration-none">Главная</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/#categories" className="link-muted text-decoration-none">Категории</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {title}
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
                    <a href={`/c/${rawSlug}`} className="btn btn-outline-secondary btn-sm">
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
                    href={buildHref(rawSlug, sp, { view: 'grid' })}
                    className={`btn btn-outline-secondary btn-sm ${view === 'grid' ? 'active' : ''}`}
                    title="Плитка"
                  >
                    <i className="bi bi-grid-3x3-gap" />
                  </a>
                  <a
                    href={buildHref(rawSlug, sp, { view: 'list' })}
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
                            {/* Бейджи статусов */}
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
                            {/* Описание (до 500 символов) */}
                            {p.about && (
                              <div className="small text-muted mt-2">
                                {truncateText(p.about, 500)}
                              </div>
                            )}
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
                          <button className="btn btn-outline-secondary" type="button">
                            <i className="bi bi-heart" />
                          </button>
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
                              <button className="btn btn-outline-secondary" type="button" aria-label="В избранное">
                                <i className="bi bi-heart" />
                              </button>
                            </div>
                          </div>

                          {p.about && (
                            <div className="small text-muted mt-2">
                              {truncateText(p.about, 500)}
                            </div>
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
                            <button className="btn btn-outline-secondary" type="button" aria-label="В избранное">
                              <i className="bi bi-heart" />
                            </button>
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
                      <a className="page-link" href={buildHref(rawSlug, sp, { page: currentPage - 1 })} aria-label="Назад">
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
                          <a className="page-link" href={buildHref(rawSlug, sp, { page: p })}>{p}</a>
                        </li>
                      )
                    )}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a className="page-link" href={buildHref(rawSlug, sp, { page: currentPage + 1 })} aria-label="Вперёд">
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
