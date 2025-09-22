// src/app/admin/categories/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma';
import EditCategoryForm from './EditCategoryForm';

export default async function EditCategory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;           // <-- await обязателен
  const id = Number(idStr);

  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) return <main className="container py-4">Не найдено</main>;

  return (
    <main className="container py-4">
      <h1 className="h4 mb-3">Редактирование: {c.name}</h1>
      <EditCategoryForm
        id={c.id}
        initial={{
          name: c.name,
          slug: c.slug,
          seoTitle: c.seoTitle ?? '',
          seoDescription: c.seoDescription ?? '',
          seoKeywords: c.seoKeywords ?? '',
          seoH1: c.seoH1 ?? '',
        }}
      />
    </main>
  );
}
