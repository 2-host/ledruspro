// src/app/admin/providers/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EditProviderForm from './EditProviderForm';

export default async function EditProviderPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  const [p, categories] = await Promise.all([
    prisma.provider.findUnique({
      where: { id },
      include: { categories: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!p) return <main className="container py-4">Не найдено</main>;

  // Приводим данные к сериализуемому виду (простые типы)
  const selectedCategoryIds = p.categories.map((pc) => pc.categoryId);

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 m-0">Редактирование: {p.name}</h1>
        <Link href="/admin/providers" className="btn btn-secondary">Назад</Link>
      </div>

      <EditProviderForm
        id={p.id}
        initial={{
          name: p.name,
          slug: p.slug ?? '',
          title: p.title ?? '',
          city: p.city ?? '',
          priceFrom: p.priceFrom ?? '',
          rating: p.rating ?? '',
          website: p.website ?? '',
          phone: p.phone ?? '',
          about: p.about ?? '',
          avatarUrl: p.avatarUrl ?? '',
          isVerified: !!p.isVerified,
          categoryIds: selectedCategoryIds,
        }}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </main>
  );
}
