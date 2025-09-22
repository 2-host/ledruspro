// src/app/admin/providers/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import EditProviderForm from './EditProviderForm';

export default async function EditProviderPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params; // важно: await
  const id = Number(idStr);

  const [p, categories] = await Promise.all([
    prisma.provider.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!p) return <main className="container py-4">Не найдено</main>;

  return (
    <main className="container py-4">
      <h1 className="h4 mb-3">Редактирование: {p.name}</h1>
      <EditProviderForm
        id={p.id}
        initial={{
          name: p.name,
          slug: p.slug,
          title: p.title ?? '',
          city: p.city ?? '',
          priceFrom: p.priceFrom ?? '',
          rating: p.rating ?? '',
          reviewsCount: p.reviewsCount ?? 0,
          isVerified: !!p.isVerified,
          passportVerified: !!p.passportVerified,
          worksByContract: !!p.worksByContract,
          experienceYears: p.experienceYears ?? 1,
          ownerEmail: p.ownerEmail ?? '',
          website: p.website ?? '',
          phone: p.phone ?? '',
          about: p.about ?? '',
          avatarUrl: p.avatarUrl ?? '',
          categoryIds: p.categories.map((pc) => pc.categoryId),
        }}
        categories={categories}
      />
    </main>
  );
}
