// src/app/categories/page.tsx
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Все категории — каталог исполнителей',
  description:
    'Полный список категорий и подкатегорий: дизайнеры, инженеры, электрики, монтажники и другие. Выберите направление и найдите исполнителя.',
};

export default async function AllCategoriesPage() {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    include: {
      children: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true, fullSlug: true },
      },
    },
  });

  return (
    <>
      {/* HERO / заголовок */}
      <header className="subhero py-4">
        <div className="container">
          <h1 className="h2 fw-bold mb-1">Все категории</h1>
          <p className="text-secondary mb-0">
            Выберите направление: подкатегории показаны внутри каждого раздела.
          </p>
        </div>
      </header>

      <main className="py-5">
        <div className="container">
          {/* Сетка карточек корневых категорий */}
          <div className="row g-4">
            {roots.map((r) => (
              <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                <div className="card-modern h-100 p-3">
                  {/* Заголовок карточки + ссылка на сам корневой раздел */}
                  <a
                    href={`/c/${encodeURIComponent((r as any).fullSlug || r.slug)}`}
                    className="text-decoration-none"
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-collection fs-4 text-primary" />
                      <h2 className="h5 m-0">{r.name}</h2>
                    </div>
                  </a>

                  {/* Подкатегории-чипы */}
                  {r.children.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {r.children.map((ch) => (
                        <a
                          key={ch.id}
                          href={`/c/${ch.fullSlug}`}
                          className="chip chip-link"
                          title={ch.name}
                        >
                          {ch.name}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-secondary small">Подкатегорий нет</div>
                  )}

                  {/* Кнопка «Смотреть исполнителей» */}
                  <div className="mt-3">
                    <a
                      href={`/c/${encodeURIComponent((r as any).fullSlug || r.slug)}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Смотреть исполнителей <i className="bi bi-chevron-right" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Доп. SEO-блок (по желанию можно убрать) 
          <section className="mt-5">
            <h2 className="h5 mb-2">Как выбрать подкатегорию</h2>
            <p className="text-secondary mb-0">
              Сначала откройте нужный раздел (например, «Дизайнеры»), затем выберите конкретное
              направление: интерьер, светодизайн, рабочие чертежи и т.д. Так вы быстрее найдёте
              подходящих исполнителей и сможете сравнить их по портфолио, цене и отзывам.
            </p>
          </section>*/}
        </div>
      </main>
    </>
  );
}
